<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Attributes\Scope as ScopeAttribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Routing\Route as RoutingRoute;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use ReflectionClass;
use ReflectionMethod;
use ReflectionNamedType;
use Throwable;

#[Signature('notes:generate
    {--path= : Path vault Obsidian (default: root proyek).}
    {--folder=Catatan : Folder tujuan catatan di dalam vault.}
    {--only= : Bagian yang digenerate, pisahkan dengan koma (models,controllers,features,index).}
    {--prune : Hapus catatan hasil generate yang tidak lagi memiliki padanan di kode.}')]
#[Description('Generate catatan Obsidian dari model, controller, rute, dan fitur proyek.')]
class GenerateObsidianNotesCommand extends Command
{
    private Filesystem $files;

    /**
     * @var array<string, bool>
     */
    private array $sections = [];

    /**
     * @var array<string, array<int, string>>
     */
    private array $modelUsages = [];

    /**
     * @var array<string, bool>
     */
    private array $written = [];

    public function handle(): int
    {
        $this->files = new Filesystem;

        try {
            $vaultPath = $this->resolveVaultPath();
            $this->sections = $this->resolveSections();
        } catch (\RuntimeException $exception) {
            $this->components->error($exception->getMessage());

            return self::FAILURE;
        }

        $notesFolder = trim((string) $this->option('folder'), '/');
        $notesPath = $vaultPath.'/'.$notesFolder;

        $this->files->ensureDirectoryExists($notesPath);

        $models = $this->inspectModels();
        $controllers = $this->inspectControllers();

        $this->modelUsages = $this->buildModelUsages($controllers);

        if ($this->sections['models']) {
            $this->writeModelNotes($models, $notesPath);
        }

        if ($this->sections['controllers']) {
            $this->writeControllerNotes($controllers, $notesPath);
        }

        $features = $this->parseFeatures();

        if ($this->sections['features']) {
            $this->writeFeatureNotes($features, $models, $controllers, $notesPath);
        }

        if ($this->sections['index']) {
            $this->writeIndexNote($models, $controllers, $features, $notesPath);
        }

        if ($this->option('prune')) {
            $this->pruneNotes($notesPath);
        }

        $this->components->info(sprintf(
            'Catatan Obsidian dibuat di %s (%d catatan).',
            $notesPath,
            count($this->written),
        ));

        $this->components->bulletList([
            'Model: '.count($models),
            'Controller: '.count($controllers),
            'Fitur: '.count($features),
        ]);

        return self::SUCCESS;
    }

    private function resolveVaultPath(): string
    {
        $path = (string) ($this->option('path') ?: base_path());

        if (! str_starts_with($path, '/')) {
            $path = base_path($path);
        }

        if (! $this->files->isDirectory($path)) {
            throw new \RuntimeException("Vault Obsidian tidak ditemukan: {$path}");
        }

        return rtrim($path, '/');
    }

    /**
     * @return array<string, bool>
     */
    private function resolveSections(): array
    {
        $requested = collect(explode(',', (string) $this->option('only')))
            ->map(fn (string $section): string => strtolower(trim($section)))
            ->filter()
            ->values();

        $available = ['models', 'controllers', 'features', 'index'];

        if ($requested->isEmpty()) {
            return array_fill_keys($available, true);
        }

        foreach ($requested as $section) {
            if (! in_array($section, $available, true)) {
                throw new \RuntimeException("Bagian [{$section}] tidak dikenal. Pilihan: ".implode(', ', $available));
            }
        }

        return collect($available)
            ->mapWithKeys(fn (string $section): array => [$section => $requested->contains($section)])
            ->all();
    }

    /**
     * @return array<string, array{
     *     class: class-string<Model>,
     *     name: string,
     *     file: string,
     *     table: string,
     *     fillable: array<int, string>,
     *     casts: array<string, string>,
     *     relations: array<int, array{method: string, type: string, related: string, relatedShort: string}>,
     *     scopes: array<int, string>
     * }>
     */
    private function inspectModels(): array
    {
        return collect($this->files->glob(app_path('Models/*.php')))
            ->map(fn (string $file): string => 'App\\Models\\'.pathinfo($file, PATHINFO_FILENAME))
            ->filter(fn (string $class): bool => class_exists($class) && is_subclass_of($class, Model::class))
            ->mapWithKeys(fn (string $class): array => [$class => $this->inspectModel($class)])
            ->all();
    }

    /**
     * @param  class-string<Model>  $modelClass
     * @return array{
     *     class: class-string<Model>,
     *     name: string,
     *     file: string,
     *     table: string,
     *     fillable: array<int, string>,
     *     casts: array<string, string>,
     *     relations: array<int, array{method: string, type: string, related: string, relatedShort: string}>,
     *     scopes: array<int, string>
     * }
     */
    private function inspectModel(string $modelClass): array
    {
        $model = new $modelClass;
        $reflection = new ReflectionClass($modelClass);

        $relations = [];

        foreach ($reflection->getMethods(ReflectionMethod::IS_PUBLIC) as $method) {
            if ($method->isStatic() || $method->getNumberOfRequiredParameters() > 0) {
                continue;
            }

            if ($method->getDeclaringClass()->getName() !== $modelClass) {
                continue;
            }

            $returnType = $method->getReturnType();

            if (! $returnType instanceof ReflectionNamedType) {
                continue;
            }

            $typeName = $returnType->getName();

            if (! is_subclass_of($typeName, Relation::class)) {
                continue;
            }

            try {
                /** @var Relation<Model, Model, mixed> $relation */
                $relation = $method->invoke($model);
                $related = $relation->getRelated();
            } catch (Throwable) {
                continue;
            }

            $relations[] = [
                'method' => $method->getName(),
                'type' => class_basename($typeName),
                'related' => $related::class,
                'relatedShort' => class_basename($related::class),
            ];
        }

        return [
            'class' => $modelClass,
            'name' => class_basename($modelClass),
            'file' => 'app/Models/'.class_basename($modelClass).'.php',
            'table' => $model->getTable(),
            'fillable' => $model->getFillable(),
            'casts' => collect($model->getCasts())
                ->map(fn (mixed $cast): string => $this->formatCast($cast))
                ->all(),
            'relations' => $relations,
            'scopes' => $this->inspectScopes($reflection),
        ];
    }

    private function formatCast(mixed $cast): string
    {
        if (! is_string($cast)) {
            return (string) json_encode($cast);
        }

        if (class_exists($cast)) {
            return enum_exists($cast)
                ? class_basename($cast).' (enum)'
                : class_basename($cast);
        }

        return $cast;
    }

    /**
     * @param  ReflectionClass<Model>  $reflection
     * @return array<int, string>
     */
    private function inspectScopes(ReflectionClass $reflection): array
    {
        $scopes = [];

        foreach ($reflection->getMethods(ReflectionMethod::IS_PUBLIC) as $method) {
            if ($method->getDeclaringClass()->getName() !== $reflection->getName()) {
                continue;
            }

            if (str_starts_with($method->getName(), 'scope')) {
                $scopes[] = Str::camel(substr($method->getName(), 5));
            } elseif ($method->getAttributes(ScopeAttribute::class) !== []) {
                $scopes[] = $method->getName();
            }
        }

        return array_values(array_unique($scopes));
    }

    /**
     * @return array<string, array{
     *     class: string,
     *     name: string,
     *     folder: string,
     *     file: string,
     *     routes: array<int, array{methods: string, uri: string, name: ?string, action: ?string, middleware: array<int, string>}>,
     *     models: array<int, string>,
     *     pages: array<int, string>
     * }>
     */
    private function inspectControllers(): array
    {
        $controllers = [];

        foreach ($this->files->allFiles(app_path('Http/Controllers')) as $file) {
            $relative = $file->getRelativePathname();

            if (! str_ends_with($relative, 'Controller.php')) {
                continue;
            }

            $class = 'App\\Http\\Controllers\\'.str_replace(['/', '.php'], ['\\', ''], $relative);

            if (! class_exists($class)) {
                continue;
            }

            $reflection = new ReflectionClass($class);

            if ($reflection->isAbstract() || class_basename($class) === 'Controller') {
                continue;
            }

            $controllers[$class] = $this->inspectController($class, $relative);
        }

        return $controllers;
    }

    /**
     * @return array{
     *     class: string,
     *     name: string,
     *     folder: string,
     *     file: string,
     *     routes: array<int, array{methods: string, uri: string, name: ?string, action: ?string, middleware: array<int, string>}>,
     *     models: array<int, string>,
     *     pages: array<int, string>
     * }
     */
    private function inspectController(string $controllerClass, string $relativePath): array
    {
        $source = $this->files->get(app_path('Http/Controllers/'.$relativePath));

        return [
            'class' => $controllerClass,
            'name' => class_basename($controllerClass),
            'folder' => dirname(str_replace('\\', '/', $relativePath)) === '.' ? 'Controllers' : 'Controllers/'.dirname(str_replace('\\', '/', $relativePath)),
            'file' => 'app/Http/Controllers/'.$relativePath,
            'routes' => $this->controllerRoutes($controllerClass),
            'models' => $this->modelsReferencedIn($source),
            'pages' => $this->pagesReferencedIn($source),
        ];
    }

    /**
     * @return array<int, array{methods: string, uri: string, name: ?string, action: ?string, middleware: array<int, string>}>
     */
    private function controllerRoutes(string $controllerClass): array
    {
        return collect(Route::getRoutes()->getRoutes())
            ->filter(function (RoutingRoute $route) use ($controllerClass): bool {
                $action = $route->getActionName();

                return $action === $controllerClass || str_starts_with($action, $controllerClass.'@');
            })
            ->map(function (RoutingRoute $route) use ($controllerClass): array {
                $action = $route->getActionName();
                $method = str_starts_with($action, $controllerClass.'@')
                    ? substr($action, strlen($controllerClass) + 1)
                    : null;

                $methods = collect($route->methods())
                    ->reject(fn (string $verb): bool => $verb === 'HEAD')
                    ->implode('|');

                return [
                    'methods' => $methods,
                    'uri' => '/'.ltrim($route->uri(), '/'),
                    'name' => $route->getName(),
                    'action' => $method,
                    'middleware' => collect($route->middleware())
                        ->reject(fn (string $middleware): bool => str_starts_with($middleware, 'Illuminate\\'))
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    private function modelsReferencedIn(string $source): array
    {
        preg_match_all('/use\s+(App\\\\Models\\\\[A-Za-z0-9_\\\\]+);/', $source, $imports);
        preg_match_all('/App\\\\Models\\\\([A-Za-z0-9_]+)::/', $source, $usages);

        return collect($imports[1])
            ->merge(
                collect($usages[1])->map(fn (string $name): string => 'App\\Models\\'.$name)
            )
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    private function pagesReferencedIn(string $source): array
    {
        preg_match_all('/Inertia::render\(\s*[\'"]([^\'"]+)[\'"]/', $source, $matches);

        return collect($matches[1])->unique()->values()->all();
    }

    /**
     * @param  array<string, array{name: string, models: array<int, string>}>  $controllers
     * @return array<string, array<int, string>>
     */
    private function buildModelUsages(array $controllers): array
    {
        /** @var array<string, array<int, string>> $usages */
        $usages = [];

        foreach ($controllers as $controller) {
            foreach ($controller['models'] as $modelClass) {
                $usages[$modelClass][] = $controller['name'];
            }
        }

        return collect($usages)
            ->map(fn (array $names): array => array_values(array_unique($names)))
            ->all();
    }

    /**
     * @param  array<string, array<string, mixed>>  $models
     */
    private function writeModelNotes(array $models, string $notesPath): void
    {
        $folder = $notesPath.'/Models';
        $this->files->ensureDirectoryExists($folder);

        foreach ($models as $model) {
            $lines = [
                '---',
                'tags:',
                '  - ebitdamax',
                '  - model',
                'type: model',
                'table: '.$model['table'],
                'source: '.$model['file'],
                'generated: '.now()->toDateString(),
                '---',
                '',
                '# '.$model['name'],
                '',
                '> [!info] Model Eloquent',
                '> - Tabel: `'.$model['table'].'`',
                '> - File: `'.$model['file'].'`',
                '> - Indeks: [[Indeks]]',
                '',
            ];

            if ($model['fillable'] !== []) {
                $lines[] = '## Mass Assignment (fillable)';
                $lines[] = '';

                foreach ($model['fillable'] as $column) {
                    $lines[] = '- `'.$column.'`';
                }

                $lines[] = '';
            }

            if ($model['casts'] !== []) {
                $lines[] = '## Casts';
                $lines[] = '';
                $lines[] = '| Kolom | Tipe |';
                $lines[] = '| --- | --- |';

                foreach ($model['casts'] as $column => $cast) {
                    $lines[] = '| `'.$column.'` | `'.$this->escapeTableCell($cast).'` |';
                }

                $lines[] = '';
            }

            if ($model['relations'] !== []) {
                $lines[] = '## Relasi';
                $lines[] = '';
                $lines[] = '| Method | Tipe | Model |';
                $lines[] = '| --- | --- | --- |';

                foreach ($model['relations'] as $relation) {
                    $lines[] = sprintf(
                        '| `%s()` | %s | [[%s]] |',
                        $relation['method'],
                        $relation['type'],
                        $relation['relatedShort'],
                    );
                }

                $lines[] = '';
            }

            if ($model['scopes'] !== []) {
                $lines[] = '## Scope';
                $lines[] = '';

                foreach ($model['scopes'] as $scope) {
                    $lines[] = '- `'.$scope.'`';
                }

                $lines[] = '';
            }

            $usedBy = $this->modelUsages[$model['class']] ?? [];

            if ($usedBy !== []) {
                $lines[] = '## Digunakan oleh';
                $lines[] = '';

                foreach ($usedBy as $controllerName) {
                    $lines[] = '- [['.$controllerName.']]';
                }

                $lines[] = '';
            }

            $this->putNote($folder, $model['name'], implode(PHP_EOL, $lines));
        }
    }

    /**
     * @param  array<string, array<string, mixed>>  $controllers
     */
    private function writeControllerNotes(array $controllers, string $notesPath): void
    {
        foreach ($controllers as $controller) {
            $folder = $notesPath.'/'.$controller['folder'];
            $this->files->ensureDirectoryExists($folder);

            $lines = [
                '---',
                'tags:',
                '  - ebitdamax',
                '  - controller',
                'type: controller',
                'source: '.$controller['file'],
                'generated: '.now()->toDateString(),
                '---',
                '',
                '# '.$controller['name'],
                '',
                '> [!info] Controller',
                '> - File: `'.$controller['file'].'`',
                '> - Indeks: [[Indeks]]',
                '',
            ];

            if ($controller['routes'] === []) {
                $lines[] = '## Rute';
                $lines[] = '';
                $lines[] = '_Tidak ada rute yang terdaftar._';
                $lines[] = '';
            } else {
                $lines[] = '## Rute';
                $lines[] = '';
                $lines[] = '| Method | URI | Name | Action | Middleware |';
                $lines[] = '| --- | --- | --- | --- | --- |';

                foreach ($controller['routes'] as $route) {
                    $lines[] = sprintf(
                        '| `%s` | `%s` | `%s` | `%s` | %s |',
                        $route['methods'],
                        $route['uri'],
                        $route['name'] ?? '-',
                        $route['action'] ?? '__invoke',
                        $route['middleware'] === [] ? '-' : '`'.implode('`, `', $route['middleware']).'`',
                    );
                }

                $lines[] = '';
            }

            if ($controller['models'] !== []) {
                $lines[] = '## Model terkait';
                $lines[] = '';

                foreach ($controller['models'] as $modelClass) {
                    $lines[] = '- [['.class_basename($modelClass).']]';
                }

                $lines[] = '';
            }

            if ($controller['pages'] !== []) {
                $lines[] = '## Halaman Inertia';
                $lines[] = '';

                foreach ($controller['pages'] as $page) {
                    $lines[] = '- `resources/js/pages/'.$page.'`';
                }

                $lines[] = '';
            }

            $this->putNote($folder, $controller['name'], implode(PHP_EOL, $lines));
        }
    }

    /**
     * @return array<int, array{title: string, body: string}>
     */
    private function parseFeatures(): array
    {
        $readmePath = base_path('README.md');

        if (! $this->files->exists($readmePath)) {
            return [];
        }

        $readme = $this->files->get($readmePath);

        if (! preg_match('/^## Fitur Utama\s*$(.*?)(?=^## |\z)/ms', $readme, $section)) {
            return [];
        }

        preg_match_all('/^### (.+?)\s*$(.*?)(?=^### |\z)/ms', $section[1], $matches, PREG_SET_ORDER);

        return collect($matches)
            ->map(fn (array $match): array => [
                'title' => trim($match[1]),
                'body' => trim($match[2]),
            ])
            ->all();
    }

    /**
     * @param  array<int, array{title: string, body: string}>  $features
     * @param  array<string, array<string, mixed>>  $models
     * @param  array<string, array<string, mixed>>  $controllers
     */
    private function writeFeatureNotes(array $features, array $models, array $controllers, string $notesPath): void
    {
        if ($features === []) {
            return;
        }

        $folder = $notesPath.'/Fitur';
        $this->files->ensureDirectoryExists($folder);

        $modelNames = collect($models)->pluck('name');
        $controllerTargets = collect($controllers)
            ->map(fn (array $controller): array => [
                'name' => $controller['name'],
                'label' => Str::headline(str_replace('Controller', '', $controller['name'])),
            ])
            ->all();

        foreach ($features as $feature) {
            $lines = [
                '---',
                'tags:',
                '  - ebitdamax',
                '  - fitur',
                'type: fitur',
                'generated: '.now()->toDateString(),
                '---',
                '',
                '# '.$feature['title'],
                '',
                $feature['body'],
                '',
            ];

            $relatedModels = $modelNames
                ->filter(fn (string $name): bool => $this->featureMentions($feature, Str::headline($name)))
                ->values()
                ->all();

            $relatedControllers = collect($controllerTargets)
                ->filter(fn (array $target): bool => $this->featureMentions($feature, $target['label']))
                ->pluck('name')
                ->all();

            if ($relatedModels !== [] || $relatedControllers !== []) {
                $lines[] = '## Kode terkait';
                $lines[] = '';

                foreach ($relatedModels as $modelName) {
                    $lines[] = '- Model: [['.$modelName.']]';
                }

                foreach ($relatedControllers as $controllerName) {
                    $lines[] = '- Controller: [['.$controllerName.']]';
                }

                $lines[] = '';
            }

            $this->putNote($folder, $feature['title'], implode(PHP_EOL, $lines));
        }
    }

    /**
     * @param  array{title: string, body: string}  $feature
     */
    private function featureMentions(array $feature, string $label): bool
    {
        if (mb_strlen($label) < 4) {
            return false;
        }

        $haystack = $feature['title'].' '.$feature['body'];

        return stripos($haystack, $label) !== false
            || stripos($haystack, Str::plural($label)) !== false;
    }

    /**
     * @param  array<string, array<string, mixed>>  $models
     * @param  array<string, array<string, mixed>>  $controllers
     * @param  array<int, array{title: string, body: string}>  $features
     */
    private function writeIndexNote(array $models, array $controllers, array $features, string $notesPath): void
    {
        $lines = [
            '---',
            'tags:',
            '  - ebitdamax',
            '  - moc',
            'type: indeks',
            'generated: '.now()->toDateString(),
            '---',
            '',
            '# EBITDA Max APN — Indeks Kode',
            '',
            '> [!abstract] Peta konten',
            '> Indeks ini dibuat otomatis dari kode proyek. Jalankan `php artisan notes:generate` untuk menyegarkan.',
            '',
            '## Fitur',
            '',
        ];

        foreach ($features as $feature) {
            $lines[] = '- [['.$feature['title'].']]';
        }

        if ($features === []) {
            $lines[] = '_Tidak ada fitur yang terbaca dari README._';
        }

        $lines[] = '';
        $lines[] = '## Model';
        $lines[] = '';
        $lines[] = '| Model | Tabel | Relasi |';
        $lines[] = '| --- | --- | --- |';

        foreach (collect($models)->sortBy('name') as $model) {
            $lines[] = sprintf('| [[%s]] | `%s` | %d |', $model['name'], $model['table'], count($model['relations']));
        }

        $lines[] = '';
        $lines[] = '## Controller';
        $lines[] = '';
        $lines[] = '| Controller | Rute |';
        $lines[] = '| --- | --- |';

        foreach (collect($controllers)->sortBy('name') as $controller) {
            $lines[] = sprintf('| [[%s]] | %d |', $controller['name'], count($controller['routes']));
        }

        $lines[] = '';
        $lines[] = '## Dokumentasi';
        $lines[] = '';
        $lines[] = '- [[README]]';
        $lines[] = '- [[deployment]]';

        if ($this->files->exists(base_path('product_requirements_document.md'))) {
            $lines[] = '- [[product_requirements_document]]';
        }

        foreach ($this->files->glob(base_path('docs/*.md')) as $doc) {
            $lines[] = '- [['.pathinfo($doc, PATHINFO_FILENAME).']]';
        }

        $lines[] = '';

        $this->putNote($notesPath, 'Indeks', implode(PHP_EOL, $lines));
    }

    private function pruneNotes(string $notesPath): void
    {
        foreach (['Models', 'Controllers', 'Fitur'] as $folder) {
            $path = $notesPath.'/'.$folder;

            if (! $this->files->isDirectory($path)) {
                continue;
            }

            foreach ($this->files->allFiles($path) as $file) {
                if ($file->getExtension() !== 'md') {
                    continue;
                }

                $key = $this->normalizePath($file->getPathname());

                if (! isset($this->written[$key])) {
                    $this->files->delete($file->getPathname());
                }
            }
        }
    }

    private function putNote(string $folder, string $name, string $contents): void
    {
        $path = $folder.'/'.$name.'.md';

        $this->files->ensureDirectoryExists($folder);
        $this->files->put($path, $contents.PHP_EOL);

        $this->written[$this->normalizePath($path)] = true;
    }

    private function normalizePath(string $path): string
    {
        return str_replace('\\', '/', $path);
    }

    private function escapeTableCell(string $value): string
    {
        return str_replace('|', '\\|', $value);
    }
}
