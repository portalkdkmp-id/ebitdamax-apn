<?php

test('health endpoint is publicly available', function () {
    $this->get('/health')->assertOk();
});
