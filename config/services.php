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

    'lms_kdkmp' => [
        'learning_paths_url' => env(
            'LMS_KDKMP_LEARNING_PATHS_URL',
            'https://lms.agrinaspangan.id/learning-paths',
        ),
    ],

    'lark' => [
        'enabled' => env('LARK_SSO_ENABLED', false),
        'app_id' => env('LARK_APP_ID'),
        'app_secret' => env('LARK_APP_SECRET'),
        'redirect_uri' => env(
            'LARK_REDIRECT_URI',
            rtrim((string) env('APP_URL', 'http://localhost'), '/').'/auth/lark/callback',
        ),
        'base_url' => env('LARK_BASE_URL', 'https://open.larksuite.com'),
        'authorization_url' => env(
            'LARK_AUTHORIZATION_URL',
            'https://accounts.larksuite.com/open-apis/authen/v1/authorize',
        ),
        'scopes' => env('LARK_SCOPES', 'component:user_profile contact:user.email:readonly'),
    ],

];
