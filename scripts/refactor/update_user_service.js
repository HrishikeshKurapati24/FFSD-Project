const fs = require('fs');

const svcPath = './services/admin/adminUserService.js';
const ctrlPath = './controllers/admin/adminUserController.js';

let svcC = fs.readFileSync(svcPath, 'utf8');

const newMethods = `
    static async getVerifiedBrands() {
        return await this.BrandInfo.find({ verified: true }).lean();
    }

    static async getVerifiedInfluencers() {
        return await this.InfluencerInfo.aggregate([
            { $match: { verified: true } },
            {
                $lookup: {
                    from: 'influencersocials',
                    localField: '_id',
                    foreignField: 'influencerId',
                    as: 'socials'
                }
            },
            {
                $addFields: {
                    platform: {
                        $let: {
                            vars: {
                                platformList: {
                                    $reduce: {
                                        input: { $ifNull: [{ $arrayElemAt: ['$socials.platforms', 0] }, []] },
                                        initialValue: [],
                                        in: { $concatArrays: ['$$value', ['$$this.platform']] }
                                    }
                                }
                            },
                            in: {
                                $reduce: {
                                    input: '$$platformList',
                                    initialValue: '',
                                    in: {
                                        $concat: [
                                            '$$value',
                                            { $cond: [{ $eq: ['$$value', ''] }, '', ', '] },
                                            '$$this'
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    audienceSize: {
                        $reduce: {
                            input: { $ifNull: [{ $arrayElemAt: ['$socials.platforms', 0] }, []] },
                            initialValue: 0,
                            in: { $add: ['$$value', { $ifNull: ['$$this.followers', 0] }] }
                        }
                    }
                }
            }
        ]);
    }
}
`;

// It's easier to just append before the closing bracket of the class definition
svcC = svcC.replace(/}\s*module\.exports = adminUserService;/, newMethods + '\nmodule.exports = adminUserService;');

// Need to also bind BrandInfo and InfluencerInfo reference
svcC = svcC.replace('class adminUserService {', 'class adminUserService {\n    static BrandInfo = require("../../models/BrandMongo").BrandInfo;\n    static InfluencerInfo = require("../../models/InfluencerMongo").InfluencerInfo;');

fs.writeFileSync(svcPath, svcC);


// Now update Controller
let ctrlC = fs.readFileSync(ctrlPath, 'utf8');

// Replace controller logic
const verifiedBrandsReplacement = `
    async getVerifiedBrands(req, res) {
        try {
            const brands = await AdminUserManagementService.getVerifiedBrands();
            res.json({ success: true, brands });
        } catch (error) {
            console.error("Error in getVerifiedBrands:", error);
            res.status(500).json({ success: false, message: "Failed to fetch verified brands" });
        }
    },

    async getVerifiedInfluencers(req, res) {
        try {
            const influencers = await AdminUserManagementService.getVerifiedInfluencers();
            res.json({ success: true, influencers });
        } catch (error) {
            console.error("Error in getVerifiedInfluencers:", error);
            res.status(500).json({ success: false, message: "Failed to fetch verified influencers" });
        }
    }
};
`;

ctrlC = ctrlC.replace(/async getVerifiedBrands\(req, res\) \{[\s\S]*\}\s*};/, verifiedBrandsReplacement);

// Also since we use getDashboardService but we changed the name, let's fix that
ctrlC = ctrlC.replace(/AdminUserManagementService/g, 'AdminUserService');

// We also need to require it if it's not already defined as AdminUserService
ctrlC = ctrlC.replace('const AdminUserManagementService = require("../../services/admin/adminUserManagementService");', 'const AdminUserService = require("../../services/admin/adminUserService");');

fs.writeFileSync(ctrlPath, ctrlC);

