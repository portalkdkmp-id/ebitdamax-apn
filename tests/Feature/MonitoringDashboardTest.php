<?php

use Inertia\Testing\AssertableInertia as Assert;

test('guests can visit the monitoring dashboard while auth middleware is bypassed', function () {
    $response = $this->get(route('monitoring.index'));

    $response->assertOk();
});

test('monitoring dashboard renders stock and produk subsidi sections', function () {
    $response = $this->get(route('monitoring.index'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Monitoring/Index')
            ->has('stock.stock_berputar')
            ->has('stock.active_sku')
            ->has('stock.jumlah_sku')
            ->has('produk_subsidi.total_sku_subsidi')
            ->has('produk_subsidi.availability.gerai')
            ->has('produk_subsidi.availability.kabupaten')
            ->has('produk_subsidi.availability.provinsi')
            ->has('produk_subsidi.availability.nasional')
        );
});

test('monitoring dashboard stock summary exposes the documented dummy values', function () {
    $response = $this->get(route('monitoring.index'));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('stock.stock_berputar', 12450)
        ->where('stock.active_sku', 482)
        ->where('stock.jumlah_sku', 615)
    );
});

test('monitoring dashboard availability summary exposes the documented dummy values', function () {
    $response = $this->get(route('monitoring.index'));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('produk_subsidi.total_sku_subsidi', 38)
        ->where('produk_subsidi.availability.gerai', 72.4)
        ->where('produk_subsidi.availability.kabupaten', 80.1)
        ->where('produk_subsidi.availability.provinsi', 85.6)
        ->where('produk_subsidi.availability.nasional', 89.2)
    );
});
