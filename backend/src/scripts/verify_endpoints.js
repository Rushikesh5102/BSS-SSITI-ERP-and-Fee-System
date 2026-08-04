const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function runVerification() {
    console.log('🚀 Initiating Backend Endpoint Verification...');
    
    try {
        // 1. Try to login as Store Manager
        console.log('\n🔐 1. Attempting login as Store Manager (storemanager@saiiti.edu.in)...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'storemanager@saiiti.edu.in',
            password: 'Store@123'
        });
        
        if (loginRes.status === 200 && loginRes.data.success) {
            console.log('✅ Login successful!');
            const { accessToken, user } = loginRes.data.data;
            console.log(`   User Role: ${user.role}`);
            console.log(`   User Name: ${user.name}`);
            
            // Set headers for next requests
            const headers = {
                Authorization: `Bearer ${accessToken}`
            };

            // 2. Add an item
            console.log('\n📦 2. Adding a test item to inventory...');
            const createRes = await axios.post(`${API_URL}/store/items`, {
                name: 'Test Multimeter Model X',
                sku: `TEST-SKU-${Date.now()}`,
                description: 'A calibration testing multimeter for electrical lab.',
                category: 'Tools',
                unit: 'pcs',
                reorderLevel: 3,
                pricePerUnit: 125000, // 1250 INR in paise
                location: 'Rack B-1'
            }, { headers });

            let createdItemId = '';
            if ((createRes.status === 200 || createRes.status === 201) && createRes.data.success) {
                createdItemId = createRes.data.data.id;
                console.log(`✅ Item created successfully! ID: ${createdItemId}`);
                console.log(`   Created By (User ID): ${createRes.data.data.createdById}`);
            } else {
                console.log('❌ Failed to create item:', createRes.data);
            }

            // 3. Fetch Store Items
            console.log('\n📦 3. Fetching inventory items list...');
            const itemsRes = await axios.get(`${API_URL}/store/items`, { headers });
            if (itemsRes.status === 200 && itemsRes.data.success) {
                console.log(`✅ Items fetched successfully! Found ${itemsRes.data.data.length} items.`);
            } else {
                console.log('❌ Failed to fetch items:', itemsRes.data);
            }

            // 4. Delete the test item
            if (createdItemId) {
                console.log('\n🗑️ 4. Cleaning up created test item...');
                // Note: Delete requires ADMIN role. Let's see if store manager is allowed or if we should log in as Admin.
                // Wait, delete in routes is restricted to ADMIN. Let's check if the server blocks store manager.
                try {
                    await axios.delete(`${API_URL}/store/items/${createdItemId}`, { headers });
                    console.log('❌ Security issue: Store Manager was able to delete the item (should be ADMIN only).');
                } catch (err) {
                    if (err.response && err.response.status === 403) {
                        console.log('✅ Access Control working: Store Manager correctly blocked from deleting item (403 Forbidden).');
                    } else {
                        console.log('❌ Unexpected response during delete block check:', err.message);
                    }
                }

                // Log in as Admin to delete
                console.log('🔐 Logging in as Branch Admin to delete the item...');
                const adminLogin = await axios.post(`${API_URL}/auth/login`, {
                    email: 'admin@saiiti.edu.in',
                    password: 'Admin@123'
                });
                const adminHeaders = {
                    Authorization: `Bearer ${adminLogin.data.data.accessToken}`
                };

                const deleteRes = await axios.delete(`${API_URL}/store/items/${createdItemId}`, { headers: adminHeaders });
                if (deleteRes.status === 200 && deleteRes.data.success) {
                    console.log('✅ Test item deleted successfully by Branch Admin.');
                } else {
                    console.log('❌ Failed to delete test item as admin:', deleteRes.data);
                }
            }

        } else {
            console.log('❌ Login failed:', loginRes.data);
        }
    } catch (err) {
        console.error('❌ Verification failed due to error:', err.message);
        if (err.response) {
            console.error('   Server responded with:', err.response.status, err.response.data);
        }
    }
}

runVerification();
