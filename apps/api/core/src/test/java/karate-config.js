function fn() {
    var env = karate.env || 'test';

    var config = {
        baseUrl: 'http://localhost:8080',
        timeout: 30000
    };

    var auth = karate.callSingle('classpath:so/morton/api/api/login.feature', {
        baseUrl: config.baseUrl,
        phone: '01000000001',
        code: '000001'
    });
    config.accessToken = auth.accessToken;

    karate.configure('logging', {
        mask: {
            headers:   ['Authorization', 'Cookie', 'X-Api-Key'],
            jsonPaths: ['$.password', '$..token']
        }
    });

    return config;
}