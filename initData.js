const { initializeCampaignData } = require('./initCampaignData');

const initializeAllData = async () => {
    try {
        console.log('Starting campaign data initialization...');
        await initializeCampaignData();
        console.log('Campaign data initialized successfully!');
    } catch (error) {
        console.error('Error during campaign data initialization:', error);
        process.exit(1); // Exit with error code
    }
};

// Run the initialization
initializeAllData();