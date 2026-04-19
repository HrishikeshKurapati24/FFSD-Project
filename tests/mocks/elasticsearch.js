const axios = require('axios');

jest.mock('axios');

const elasticMock = {
    get: jest.fn().mockResolvedValue({ data: { status: 'green' } }),
    put: jest.fn().mockResolvedValue({ data: { result: 'created' } }),
    post: jest.fn().mockResolvedValue({
        data: {
            hits: {
                total: { value: 0 },
                hits: []
            }
        }
    }),
    delete: jest.fn().mockResolvedValue({ data: { result: 'deleted' } }),
    head: jest.fn().mockResolvedValue({ status: 200 }),
    create: jest.fn().mockReturnThis()
};

module.exports = elasticMock;
