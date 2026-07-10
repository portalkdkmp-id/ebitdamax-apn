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
            ->has('stock.jumlah_sku_terdaftar')
            ->has('stock.jumlah_sku_aktif')
            ->has('stock.jumlah_sku_subsidi')
            ->has('stock.rata_rata_sku_per_kdkmp')
            ->has('stock.min_sku_kdkmp')
            ->has('stock.max_sku_kdkmp')
            ->has('stock.total_kdkmp')
            ->has('stock.distribusi_per_kdkmp')
            ->has('produk_subsidi.availability.gerai')
            ->has('produk_subsidi.availability.kabupaten')
            ->has('produk_subsidi.availability.provinsi')
            ->has('produk_subsidi.availability.nasional')
        );
});

test('monitoring dashboard stock summary exposes the documented dummy values', function () {
    $response = $this->get(route('monitoring.index'));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('stock.jumlah_sku_terdaftar', 1080)
        ->where('stock.jumlah_sku_aktif', 521)
        ->where('stock.jumlah_sku_subsidi', 38)
        ->where('stock.rata_rata_sku_per_kdkmp', 155)
        ->where('stock.min_sku_kdkmp', 1)
        ->where('stock.max_sku_kdkmp', 325)
        ->where('stock.total_kdkmp', 1112)
    );
});

test('monitoring dashboard availability summary exposes the documented dummy values', function () {
    $response = $this->get(route('monitoring.index'));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('produk_subsidi.availability.gerai', 72.4)
        ->where('produk_subsidi.availability.kabupaten', 80.1)
        ->where('produk_subsidi.availability.provinsi', 85.6)
        ->where('produk_subsidi.availability.nasional', 89.2)
    );
});
