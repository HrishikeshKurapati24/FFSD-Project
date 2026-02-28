const fs = require('fs');
const ctrlPath = './controllers/influencer/influencerDiscoveryController.js';

let ctrlC = fs.readFileSync(ctrlPath, 'utf8');

// Replace getInfluencerExplorePage
const p1Match = /const getInfluencerExplorePage = async \(req, res\) => \{[\s\S]*?(?=try \{[\s\S]*?const influencers[\s\S]*?res\.render)/m;
if (p1Match) {
    const s1Rep = `const getInfluencerExplorePage = async (req, res) => {
  try {
    const InfluencerDiscoveryService = require('../../services/influencer/influencerDiscoveryService');
    const influencers = await InfluencerDiscoveryService.getInfluencersForExploreData();
    res.render('brand/B2_explore', { influencers: influencers || [] });
  } catch (err) {
    console.error('Controller error:', err);
    res.status(500).render('error', {
      message: 'Error fetching influencers',
      error: { status: 500 }
    });
  }
};`;
    ctrlC = ctrlC.replace(/const getInfluencerExplorePage = async \(req, res\) => \{[\s\S]*?(?=\/\/\s*Get brand explore page for influencer)/, s1Rep + '\n\n');
}

// Replace getBrandExplorePage
const p2Match = /const getBrandExplorePage = async \(req, res\) => \{[\s\S]*?(?=try \{[\s\S]*?const \{ category, search \} = req\.query[\s\S]*?res\.render)/m;
if (p2Match) {
    const s2Rep = `const getBrandExplorePage = async (req, res) => {
  try {
    const { category, search } = req.query;
    const InfluencerDiscoveryService = require('../../services/influencer/influencerDiscoveryService');
    const responseData = await InfluencerDiscoveryService.getBrandExploreData(category, search);

    const fullResponseData = {
      ...responseData,
      selectedCategory: category || 'all',
      searchQuery: search || ''
    };

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        ...fullResponseData
      });
    }

    res.render('influencer/explore', fullResponseData);
  } catch (err) {
    console.error('Controller error:', err);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching brands'
      });
    }
    res.status(500).render('error', {
      message: 'Error fetching brands',
      error: { status: 500 }
    });
  }
};`;
    ctrlC = ctrlC.replace(/const getBrandExplorePage = async \(req, res\) => \{[\s\S]*?(?=\/\/\s*Get brand profile page for influencer)/, s2Rep + '\n\n');
}

// Replace getBrandProfilePage
const p3Match = /const getBrandProfilePage = async \(req, res\) => \{[\s\S]*?(?=try \{[\s\S]*?const brandId = new mongoose\.Types\.ObjectId\(req\.params\.id\)[\s\S]*?res\.render)/m;
if (p3Match) {
    const s3Rep = `const getBrandProfilePage = async (req, res) => {
  try {
    const brandId = req.params.id;
    if (!brandId) {
      return res.status(400).render('error', {
        message: 'Brand ID is required',
        error: { status: 400 }
      });
    }

    const InfluencerDiscoveryService = require('../../services/influencer/influencerDiscoveryService');
    const transformedBrand = await InfluencerDiscoveryService.getBrandProfileData(brandId);

    const responseData = {
      brand: transformedBrand,
      influencer: req.session.user || {}
    };

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        ...responseData
      });
    }

    res.render('influencer/brand_profile', responseData);
  } catch (error) {
    console.error('Error fetching brand profile:', error);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({
        success: false,
        message: 'Error loading brand profile'
      });
    }
    res.status(error.message === 'Brand not found' ? 404 : 500).render('error', {
      message: error.message || 'Error loading brand profile',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};`;
    ctrlC = ctrlC.replace(/const getBrandProfilePage = async \(req, res\) => \{[\s\S]*?(?=\/\/\s*Get influencer profile page)/, s3Rep + '\n\n');
}


fs.writeFileSync(ctrlPath, ctrlC);

