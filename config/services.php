<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'portal_pembangunan' => [
        'base_url' => env('PORTAL_PEMBANGUNAN_BASE_URL', 'https://portalkdkmp.id'),
        'sarpras_token' => env('PORTAL_PEMBANGUNAN_SARPRAS_TOKEN'),
    ],

    'portal_pemetaan' => [
        'base_url' => env('PORTAL_PEMETAAN_BASE_URL', 'https://pemetaan-lahan.portalkdkmp.id'),
    ],

    'lumbung_kms' => [
        'chat_url' => env('LUMBUNG_KMS_CHAT_URL', 'https://lumbung.sibisa.site/chat'),
    ],

    'lms_apn' => [
        'base_url' => env('LMS_APN_BASE_URL', 'https://lms.dev-agrinas.id'),
        'sso_key' => env('LMS_APN_SSO_KEY'),
    ],

];
