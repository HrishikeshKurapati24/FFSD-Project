'use strict';

const axios = require('axios');

const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
const ELASTICSEARCH_USERNAME = process.env.ELASTICSEARCH_USERNAME || 'elastic';
const ELASTICSEARCH_PASSWORD = process.env.ELASTICSEARCH_PASSWORD || 'changeme';

const axiosClient = axios.create({
  baseURL: ELASTICSEARCH_NODE,
  auth: {
    username: ELASTICSEARCH_USERNAME,
    password: ELASTICSEARCH_PASSWORD
  },
  headers: {
    'Content-Type': 'application/json'
  }
});

class ElasticsearchService {
  /**
   * Check if Elasticsearch is reachable
   */
  static async checkConnection() {
    try {
      await axiosClient.get('/');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Index or update a document
   */
  static async indexDocument(index, id, body) {
    try {
      const response = await axiosClient.put(`/${index}/_doc/${id}?refresh=true`, body);
      return response.data;
    } catch (error) {
      console.error(`[Elasticsearch] Error indexing document in ${index}:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(index, id) {
    try {
      const response = await axiosClient.delete(`/${index}/_doc/${id}?refresh=true`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) return null;
      console.error(`[Elasticsearch] Error deleting document from ${index}:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Search documents
   */
  static async search(index, query, filters = {}, from = 0, size = 20) {
    try {
      const body = {
        from,
        size,
        query: {
          bool: {
            must: [],
            filter: []
          }
        }
      };

      // Keyword search
      if (query) {
        body.query.bool.must.push({
          multi_match: {
            query,
            fields: ['*'],
            fuzziness: 'AUTO'
          }
        });
      } else {
        body.query.bool.must.push({ match_all: {} });
      }

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            body.query.bool.filter.push({ terms: { [key]: value } });
          } else {
            body.query.bool.filter.push({ term: { [key]: value } });
          }
        }
      });

      const response = await axiosClient.post(`/${index}/_search`, body);
      const data = response.data;

      return {
        total: data.hits.total.value,
        hits: data.hits.hits.map(h => ({
          _id: h._id,
          ...h._source
        }))
      };
    } catch (error) {
      // Re-throw to allow caller to handle fallback
      throw error;
    }
  }

  /**
   * Initialize indices (Create if not exists)
   */
  static async initIndices() {
    const indices = ['influencers', 'brands', 'campaigns'];
    for (const index of indices) {
      try {
        let exists = false;
        try {
          await axiosClient.head(`/${index}`);
          exists = true;
        } catch (err) {
          if (err.response?.status === 404) exists = false;
          else throw err;
        }

        if (!exists) {
          await axiosClient.put(`/${index}`);
          console.log(`[Elasticsearch] Created index: ${index}`);
        }
      } catch (error) {
        console.error(`[Elasticsearch] Error creating index ${index}:`, error.response?.data || error.message);
      }
    }
  }
}

module.exports = ElasticsearchService;
