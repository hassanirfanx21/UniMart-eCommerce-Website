// test_node_recommendations.js
// Test the Node.js recommendation service

const { getRecommendations } = require('../recommendation_service');

async function testRecommendations() {
    console.log('='.repeat(60));
    console.log('TESTING NODE.JS RECOMMENDATION SERVICE');
    console.log('='.repeat(60));
    
    // Test with user 5
    console.log('\n1. Testing with User 5 (existing user)...');
    try {
        const result = await getRecommendations(5, 10, 2.5);
        console.log(`   ✅ Got ${result.recommendations.length} recommendations`);
        console.log('\n   Top recommendations:');
        result.recommendations.forEach((rec, idx) => {
            console.log(`   ${idx + 1}. Product ${rec.product_id}: ${rec.predicted_rating.toFixed(4)}`);
        });
    } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
    }
    
    // Test with user 999 (new user)
    console.log('\n2. Testing with User 999 (new user - cold start)...');
    try {
        const result = await getRecommendations(999, 10, 2.5);
        console.log(`   ✅ Got ${result.recommendations.length} recommendations`);
        console.log('\n   Top recommendations:');
        result.recommendations.forEach((rec, idx) => {
            console.log(`   ${idx + 1}. Product ${rec.product_id}: ${rec.predicted_rating.toFixed(4)}`);
        });
    } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETE!');
    console.log('='.repeat(60));
}

testRecommendations();
