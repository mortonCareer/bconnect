function fn() {
    var env = karate.env || 'dev';

    var config = {
        baseUrl: 'http://localhost:8080',
        timeout: 30000
    };

    karate.configure('logging', {
        mask: {
            headers:   ['Authorization', 'Cookie', 'X-Api-Key'],
            jsonPaths: ['$.password', '$..token']
        }
    });

    return config;
}