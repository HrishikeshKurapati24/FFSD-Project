import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/brand/create_campaign.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import BrandNavigation from '../../components/brand/BrandNavigation';
import ErrorAlert from '../../components/brand/createCampaign/ErrorAlert';
import CampaignFormFields from '../../components/brand/createCampaign/CampaignFormFields';
import ProductsSection from '../../components/brand/createCampaign/ProductsSection';
// import DeliverablesSection from '../../components/brand/createCampaign/DeliverablesSection';

const EXTERNAL_ASSETS = {
  styles: [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css'
  ],
  scripts: [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js'
  ]
};

const CreateCampaign = () => {
  useExternalAssets(EXTERNAL_ASSETS);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRenewLink, setShowRenewLink] = useState(false);
  const [showUpgradeLink, setShowUpgradeLink] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: '',
    target_audience: '',
    required_channels: [],
    min_followers: '',
    objectives: '',
    required_influencers: ''
  });

  // Products state
  const [products, setProducts] = useState([
    {
      id: 0,
      name: '',
      category: '',
      target_quantity: '',
      original_price: '',
      campaign_price: '',
      description: '',
      image: null,
      imagePreview: '',
      special_instructions: ''
    }
  ]);

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});
  const [productErrors, setProductErrors] = useState({});
  
  // // Deliverables state
  // const [deliverables, setDeliverables] = useState([
  //   {
  //     id: 0,
  //     task_description: '',
  //     platform: '',
  //     num_posts: 0,
  //     num_reels: 0,
  //     num_videos: 0
  //   }
  // ]);
  
  // // Deliverables validation errors
  // const [deliverableErrors, setDeliverableErrors] = useState({});

  const handleSignOut = async (e) => {
    e?.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/brand/signout`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (data.success) {
            window.location.href = '/signin';
            return;
          }
        }
      }

      window.location.href = '/signin';
    } catch (error) {
      console.error('Error during signout:', error);
      window.location.href = '/signin';
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle checkbox changes for channels
  const handleChannelChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      required_channels: checked
        ? [...prev.required_channels, value]
        : prev.required_channels.filter(ch => ch !== value)
    }));
    // Clear error
    if (formErrors.required_channels) {
      setFormErrors(prev => ({
        ...prev,
        required_channels: ''
      }));
    }
  };

  // Add new product
  const handleAddProduct = () => {
    const newProduct = {
      id: products.length,
      name: '',
      category: '',
      target_quantity: '',
      original_price: '',
      campaign_price: '',
      description: '',
      image: null,
      imagePreview: '',
      special_instructions: ''
    };
    setProducts(prev => [...prev, newProduct]);
  };

  // Remove product
  const handleRemoveProduct = (productId) => {
    if (products.length === 1) {
      alert('You must have at least one product for the campaign.');
      return;
    }
    setProducts(prev => prev.filter(p => p.id !== productId));
    // Clear errors for removed product
    if (productErrors[productId]) {
      setProductErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[productId];
        return newErrors;
      });
    }
  };

  // Handle product field changes
  const handleProductChange = (productId, field, value) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, [field]: value } : p
    ));
    // Clear error for this field
    if (productErrors[productId] && productErrors[productId][field]) {
      setProductErrors(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          [field]: ''
        }
      }));
    }
  };

  // Handle product image change
  const handleProductImageChange = async (productId, e) => {
    const file = e.target.files[0];
    if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
      e.target.value = '';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB.');
      e.target.value = '';
        return;
      }

    // Create preview
      const reader = new FileReader();
    reader.onload = (e) => {
      setProducts(prev => prev.map(p =>
        p.id === productId
          ? { ...p, image: file, imagePreview: e.target.result }
          : p
      ));
      };
      reader.readAsDataURL(file);
  };

  // Remove product image
  const handleRemoveProductImage = (productId) => {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, image: null, imagePreview: '' }
        : p
    ));
    // Reset file input
    const input = document.getElementById(`product-image-${productId}`);
    if (input) input.value = '';
  };

  // Handle deliverable field changes
  const handleDeliverableChange = (deliverableId, field, value) => {
    setDeliverables(prev => prev.map(d =>
      d.id === deliverableId ? { ...d, [field]: value } : d
    ));
    // Clear error for this field
    if (deliverableErrors[deliverableId] && deliverableErrors[deliverableId][field]) {
      setDeliverableErrors(prev => ({
        ...prev,
        [deliverableId]: {
          ...prev[deliverableId],
          [field]: ''
        }
      }));
    }
  };

  // Add new deliverable
  const handleAddDeliverable = () => {
    const newDeliverable = {
      id: deliverables.length,
      task_description: '',
      platform: '',
      num_posts: 0,
      num_reels: 0,
      num_videos: 0
    };
    setDeliverables(prev => [...prev, newDeliverable]);
  };

  // Remove deliverable
  const handleRemoveDeliverable = (deliverableId) => {
    if (deliverables.length === 1) {
      alert('You must have at least one deliverable for the campaign.');
      return;
    }
    setDeliverables(prev => prev.filter(d => d.id !== deliverableId));
    // Clear errors for removed deliverable
    if (deliverableErrors[deliverableId]) {
      setDeliverableErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[deliverableId];
        return newErrors;
      });
    }
  };

  // Validation helper
  const setFieldError = (field, message) => {
    setFormErrors(prev => ({
      ...prev,
      [field]: message
    }));
    return Boolean(message);
  };

  // Validate form
  const validateForm = () => {
    let hasErrors = false;
    const newErrors = {};

    // Campaign Title
    if (!formData.title.trim()) {
      newErrors.title = 'Campaign title is required';
      hasErrors = true;
    } else if (formData.title.length > 100) {
      newErrors.title = 'Campaign title must be 100 characters or less';
      hasErrors = true;
    } else {
      const words = formData.title.trim().split(/\s+/).filter(word => word.length > 2);
      if (words.length < 2) {
        newErrors.title = 'Campaign title must contain at least 2 meaningful words';
        hasErrors = true;
    }
    }

    // Campaign Description
    if (!formData.description.trim()) {
      newErrors.description = 'Campaign description is required';
      hasErrors = true;
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Campaign description must be 1000 characters or less';
      hasErrors = true;
      } else {
      const words = formData.description.trim().split(/\s+/).filter(word => word.length > 2);
      if (words.length < 5) {
        newErrors.description = 'Campaign description must contain at least 5 meaningful words';
        hasErrors = true;
      }
    }

    // Start Date
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
      hasErrors = true;
    }

    // End Date
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
      hasErrors = true;
    } else if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end <= start) {
        newErrors.end_date = 'End date must be after start date';
        hasErrors = true;
    }
    }

    // Budget
    if (!formData.budget) {
      newErrors.budget = 'Budget is required';
      hasErrors = true;
    } else if (parseFloat(formData.budget) < 0) {
      newErrors.budget = 'Budget must be 0 or greater';
      hasErrors = true;
    }

    // Target Audience
    if (!formData.target_audience.trim()) {
      newErrors.target_audience = 'Target audience is required';
      hasErrors = true;
    }

    // Required Channels
    if (formData.required_channels.length === 0) {
      newErrors.required_channels = 'Please select at least one social media channel';
      hasErrors = true;
    }

    // Minimum Followers
    if (!formData.min_followers) {
      newErrors.min_followers = 'Minimum followers is required';
      hasErrors = true;
    } else if (parseInt(formData.min_followers) < 0) {
      newErrors.min_followers = 'Minimum followers must be 0 or greater';
      hasErrors = true;
    }

    // Required Influencers
    if (!formData.required_influencers) {
      newErrors.required_influencers = 'Number of required influencers is required';
      hasErrors = true;
    } else {
      const num = parseInt(formData.required_influencers);
      if (isNaN(num) || num < 1 || num > 100) {
        newErrors.required_influencers = 'Please enter a valid number between 1 and 100';
        hasErrors = true;
      }
    }

    // Campaign Objectives
    if (!formData.objectives.trim()) {
      newErrors.objectives = 'Campaign objectives are required';
      hasErrors = true;
    } else if (formData.objectives.length > 500) {
      newErrors.objectives = 'Campaign objectives must be 500 characters or less';
      hasErrors = true;
    } else {
      const words = formData.objectives.trim().split(/\s+/).filter(word => word.length > 2);
      if (words.length < 4) {
        newErrors.objectives = 'Campaign objectives must contain at least 4 meaningful words';
        hasErrors = true;
      }
    }

    // Validate products
    if (products.length === 0) {
      alert('Please add at least one product for the campaign.');
      hasErrors = true;
    } else {
      const newProductErrors = {};
      products.forEach(product => {
        const productError = {};

        // Product name
        if (!product.name.trim()) {
          productError.name = 'Product name is required';
          hasErrors = true;
    } else {
          const words = product.name.trim().split(/\s+/).filter(word => word.length > 2);
          if (words.length < 2) {
            productError.name = 'Product name must contain at least 2 meaningful words';
            hasErrors = true;
          }
        }

        // Category
        if (!product.category) {
          productError.category = 'Please select a category';
          hasErrors = true;
    }

        // Target quantity
        if (!product.target_quantity) {
          productError.target_quantity = 'Target quantity is required';
          hasErrors = true;
        } else if (parseInt(product.target_quantity) < 0) {
          productError.target_quantity = 'Target quantity must be 0 or greater';
          hasErrors = true;
        }

        // Original price
        const opVal = parseFloat(product.original_price);
        if (!product.original_price || isNaN(opVal) || opVal <= 0) {
          productError.original_price = 'Original price must be greater than 0';
          hasErrors = true;
    }

        // Campaign price
        const cpVal = parseFloat(product.campaign_price);
        if (!product.campaign_price || isNaN(cpVal) || cpVal <= 0) {
          productError.campaign_price = 'Campaign price must be greater than 0';
          hasErrors = true;
        } else if (!isNaN(opVal) && cpVal >= opVal) {
          productError.campaign_price = 'Campaign price must be less than original price';
          hasErrors = true;
        }

        // Description
        if (!product.description.trim()) {
          productError.description = 'Product description is required';
          hasErrors = true;
    }

        // Image
        if (!product.image) {
          productError.image = 'Product image is required';
      hasErrors = true;
    } else {
          const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
          if (!validTypes.includes(product.image.type)) {
            productError.image = 'Please select a valid image file (JPG, PNG, or GIF)';
            hasErrors = true;
          } else if (product.image.size > 5 * 1024 * 1024) {
            productError.image = 'Image must be less than 5MB';
            hasErrors = true;
          }
        }

        if (Object.keys(productError).length > 0) {
          newProductErrors[product.id] = productError;
        }
      });
      setProductErrors(newProductErrors);
      }

    // Validate deliverables
    if (deliverables.length === 0) {
      alert('Please add at least one deliverable for the campaign.');
      hasErrors = true;
    } else {
      const newDeliverableErrors = {};
      deliverables.forEach(deliverable => {
        const deliverableError = {};

        // Task description
        if (!deliverable.task_description.trim()) {
          deliverableError.task_description = 'Task description is required';
          hasErrors = true;
        }

        // Platform
        if (!deliverable.platform) {
          deliverableError.platform = 'Please select a platform';
          hasErrors = true;
        }

        // At least one of posts, reels, or videos should be greater than 0
        if (deliverable.num_posts === 0 && deliverable.num_reels === 0 && deliverable.num_videos === 0) {
          deliverableError.num_posts = 'Please specify at least one deliverable (posts, reels, or videos)';
          hasErrors = true;
        }

        if (Object.keys(deliverableError).length > 0) {
          newDeliverableErrors[deliverable.id] = deliverableError;
        }
      });
      setDeliverableErrors(newDeliverableErrors);
    }

    setFormErrors(newErrors);
    return !hasErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to first error
      const firstError = document.querySelector('[aria-invalid="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      return;
    }

    setLoading(true);
    setError(null);
    setShowRenewLink(false);
    setShowUpgradeLink(false);

    try {
      // Create FormData for multipart/form-data submission
      const formDataToSend = new FormData();

      // Add campaign fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('start_date', formData.start_date);
      formDataToSend.append('end_date', formData.end_date);
      formDataToSend.append('budget', formData.budget);
      formDataToSend.append('target_audience', formData.target_audience);
      formDataToSend.append('min_followers', formData.min_followers);
      formDataToSend.append('objectives', formData.objectives);
      formDataToSend.append('required_influencers', formData.required_influencers);

      // Add required channels
      formData.required_channels.forEach(channel => {
        formDataToSend.append('required_channels', channel);
      });

      // Add products
      products.forEach((product, index) => {
        formDataToSend.append(`products[${index}][name]`, product.name);
        formDataToSend.append(`products[${index}][category]`, product.category);
        formDataToSend.append(`products[${index}][target_quantity]`, product.target_quantity);
        formDataToSend.append(`products[${index}][original_price]`, product.original_price);
        formDataToSend.append(`products[${index}][campaign_price]`, product.campaign_price);
        formDataToSend.append(`products[${index}][description]`, product.description);
        if (product.special_instructions) {
          formDataToSend.append(`products[${index}][special_instructions]`, product.special_instructions);
        }
        if (product.image) {
          formDataToSend.append(`products[${index}][image]`, product.image);
        }
      });

      // Add deliverables
      // deliverables.forEach((deliverable, index) => {
      //   formDataToSend.append(`deliverables[${index}][task_description]`, deliverable.task_description);
      //   formDataToSend.append(`deliverables[${index}][platform]`, deliverable.platform);
      //   formDataToSend.append(`deliverables[${index}][num_posts]`, deliverable.num_posts);
      //   formDataToSend.append(`deliverables[${index}][num_reels]`, deliverable.num_reels);
      //   formDataToSend.append(`deliverables[${index}][num_videos]`, deliverable.num_videos);
      // });

      const response = await fetch(`${API_BASE_URL}/brand/campaigns/create`, {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.status === 401) {
        navigate('/SignIn');
        return;
      }

      // Parse response (both success and error responses)
      let result;
      try {
        // Try to parse as JSON first (works for both success and error responses)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          // Try parsing as text first
          const text = await response.text();
          try {
            result = JSON.parse(text);
          } catch (e) {
            // Not JSON, handle redirect or HTML
            if (response.redirected || response.status === 302 || response.ok) {
              navigate('/brand/home');
              return;
          } else {
              setError('Failed to create campaign. Please try again.');
              return;
          }
        }
        }
      } catch (err) {
        // If parsing fails, check status
        if (response.ok) {
          navigate('/brand/home');
          return;
        } else {
          setError('Failed to create campaign. Please try again.');
      return;
    }
      }

      // Handle response
      if (result.success) {
        alert('Campaign created successfully!');
        navigate('/brand/home');
      } else {
        // Handle error response - extract message from result
        let errorMessage = result.message || 'Failed to create campaign';

        // The backend already includes the full message, so we can use it directly
        setError(errorMessage);

        // Store showRenewLink and showUpgradeLink in state for rendering
        setShowRenewLink(result.showRenewLink || false);
        setShowUpgradeLink(result.showUpgradeLink || false);

        // Scroll to error message
        setTimeout(() => {
          const errorElement = document.querySelector('.alert-danger');
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError(err.message || 'An error occurred while creating the campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.createCampaignPageWrapper}>
      <BrandNavigation onSignOut={handleSignOut} showNotification={false} />

      <div className="form-container">
        <h2 className="form-title">
          <i className="fa-solid fa-handshake"></i> Create New Campaign
        </h2>

        <ErrorAlert
          error={error}
          showRenewLink={showRenewLink}
          showUpgradeLink={showUpgradeLink}
        />

        <form id="createCollabForm" onSubmit={handleSubmit} noValidate>
          <CampaignFormFields
            formData={formData}
            formErrors={formErrors}
            handleInputChange={handleInputChange}
            handleChannelChange={handleChannelChange}
          />

          <ProductsSection
            products={products}
            productErrors={productErrors}
            onProductChange={handleProductChange}
            onProductImageChange={handleProductImageChange}
            onRemoveProductImage={handleRemoveProductImage}
            onRemoveProduct={handleRemoveProduct}
            onAddProduct={handleAddProduct}
          />

          

          <div className="btn-group">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Creating Campaign...' : 'Create Campaign'}
                          </button>
                      </div>
                  </form>
            </div>
            </div>
      );
};

{/* <DeliverablesSection
            deliverables={deliverables}
            deliverableErrors={deliverableErrors}
            onDeliverableChange={handleDeliverableChange}
            onRemoveDeliverable={handleRemoveDeliverable}
            onAddDeliverable={handleAddDeliverable}
          /> */}

export default CreateCampaign;
