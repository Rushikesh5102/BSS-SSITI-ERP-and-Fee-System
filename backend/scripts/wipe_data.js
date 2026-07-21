const axios = require('axios');

async function run() {
    try {
        console.log('Logging into live API...');
        const { data: auth } = await axios.post('https://bss-ssiti-erp-and-fee-system.onrender.com/api/auth/login', {
            email: 'admin@saiiti.edu.in',
            password: 'Admin@123'
        });
        const token = auth.data.accessToken;
        console.log('✅ Logged in successfully. Sending clear-all-mock-data command...');
        const { data: wipe } = await axios.post('https://bss-ssiti-erp-and-fee-system.onrender.com/api/reports/clear-all-mock-data', {}, {
            headers: { Authorization: 'Bearer ' + token }
        });
        console.log('🎉 Result:', JSON.stringify(wipe, null, 2));
    } catch (err) {
        console.error('❌ Failed:', err.response?.data || err.message);
    }
}
run();
