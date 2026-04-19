const cloudinaryMock = {
    uploader: {
        upload: jest.fn().mockResolvedValue({
            secure_url: 'https://res.cloudinary.com/demo/image/upload/v12345/sample.jpg',
            public_id: 'sample_id'
        }),
        destroy: jest.fn().mockResolvedValue({ result: 'ok' })
    },
    config: jest.fn()
};

module.exports = cloudinaryMock;
