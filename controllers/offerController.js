const Offer = require('../config/OfferMongo');
const BrandInfo = require('../config/BrandMongo');

const getOffers = async (req, res) => {
    try {
        // Get all active offers and populate brand information
        const offers = await Offer.find({ status: 'active' })
            .populate('brand_id', 'brandName logoUrl')
            .sort({ created_at: -1 });

        // Transform the offers data for the view
        const transformedOffers = offers.map(offer => ({
            id: offer._id,
            brand: offer.brand_id.brandName,
            brand_logo: offer.brand_id.logoUrl,
            description: offer.description,
            offer_percentage: offer.offer_percentage,
            offer_details: offer.offer_details,
            eligibility: Array.isArray(offer.eligibility) ? offer.eligibility : [],
            start_date: offer.start_date,
            end_date: offer.end_date,
            status: offer.status
        }));

        res.render('customer/offers', {
            offers,
            query,
            title: 'Offers',
            subtitle: 'Discover the best brand offers tailored for you'
        });
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).render('error', {
            message: 'Error loading offers',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

const getOfferDetails = async (req, res) => {
    try {
        const { offerId } = req.params;

        if (!offerId) {
            return res.status(400).json({
                success: false,
                message: 'Offer ID is required'
            });
        }

        const offer = await Offer.findById(offerId)
            .populate('brand_id', 'brandName logoUrl website');

        if (!offer) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }

        // Format the response data
        const formattedOffer = {
            id: offer._id,
            brand: offer.brand_id.brandName,
            brand_logo: offer.brand_id.logoUrl,
            brand_website: offer.brand_id.website,
            description: offer.description,
            offer_percentage: offer.offer_percentage,
            offer_details: offer.offer_details,
            eligibility: Array.isArray(offer.eligibility) ? offer.eligibility : [],
            start_date: offer.start_date,
            end_date: offer.end_date,
            status: offer.status
        };

        res.json({
            success: true,
            offer: formattedOffer
        });
    } catch (error) {
        console.error('Error fetching offer details:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading offer details',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    getOffers,
    getOfferDetails
};