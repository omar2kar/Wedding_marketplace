const http = require('http');

// Test API endpoint directly
function testAPI() {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/services',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        
        console.log(`✅ Status Code: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log('\n📊 API Response:');
                console.log('Number of vendors:', jsonData.length);
                
                if (jsonData.length > 0) {
                    console.log('\nFirst vendor:');
                    console.log(JSON.stringify(jsonData[0], null, 2));
                }
            } catch (error) {
                console.error('❌ JSON Parse Error:', error.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request Error:', error.message);
    });

    req.end();
}

console.log('🔍 Testing API endpoint: http://localhost:5000/api/services');
testAPI();
