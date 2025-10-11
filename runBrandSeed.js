const { initializeBrandData } = require('./initBrandData');

const runBrandSeed = async () => {
    try {
        console.log('🚀 Starting brand seed data initialization...\n');

        await initializeBrandData();

        console.log('\n✅ Brand seed data initialization completed successfully!');
        console.log('📊 Summary:');
        console.log('   • 5 Brand accounts created');
        console.log('   • Complete social media and analytics data');
        console.log('   • All credentials: Password: Brand@123');

    } catch (error) {
        console.error('\n❌ Brand seed data initialization failed:');
        console.error(error.message);
        process.exit(1);
    }
};

// Run the script
runBrandSeed();
