const http = require('http');

const signupData = JSON.stringify({
    firstName: "Test",
    lastName: "Owner",
    email: "testowner4@example.com",
    password: "password123",
    role: "OWNER",
    age: 30
});

const req = http.request('http://localhost:8080/api/auth/signup', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(signupData)
    }
}, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const { token } = JSON.parse(body);
        if(!token) { console.log('Signup failed', body); return; }

        const propData = JSON.stringify({
            name: "Test Prop",
            address: "123 Test St",
            type: "APARTMENT",
            valuation: 300000,
            cctvCount: 3,
            rules: "NO PETS",
            waterSupplyType: "Municipal",
            waterAvailability: "24/7",
            maintenanceAmount: 5000,
            maintenanceFrequency: "Monthly",
            parkingType: "Covered",
            parkingSlots: 1,
            securityGuardStatus: "Daytime",
            biometricAccess: true,
            fireSafety: true
        });

        const req2 = http.request('http://localhost:8080/api/properties', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
                'Content-Length': Buffer.byteLength(propData)
            }
        }, (res2) => {
            let body2 = '';
            res2.on('data', chunk => body2 += chunk);
            res2.on('end', () => {
                console.log('Status Property:', res2.statusCode);
                console.log('Response Property:', body2);
            });
        });
        req2.on('error', e => console.error(e));
        req2.write(propData);
        req2.end();
    });
});
req.on('error', e => console.error(e));
req.write(signupData);
req.end();
