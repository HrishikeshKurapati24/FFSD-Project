const offers = [
    {
        brand: "Tata CLiQ",
        description: "End of Season Sale: Up to 50% off on fashion & lifestyle products.",
        image: "tata cliq.jpg",
        offerLink: "https://www.tatacliq.com/end-of-season-sale",
        brandLink: "https://www.tatacliq.com"
    },
    {
        brand: "Flipkart",
        description: "Best Offers & Discounts on electronics, apparel, and more.",
        image: "flipkart.jpg",
        offerLink: "https://www.flipkart.com/offers-store",
        brandLink: "https://www.flipkart.com"
    },
    {
        brand: "Shoppers Stop",
        description: "Up to 50% off on over 500+ brands in apparel, watches, and more.",
        image: "shoppers stop.jpg",
        offerLink: "https://www.shoppersstop.com/bargain",
        brandLink: "https://www.shoppersstop.com"
    },
    {
        brand: "Myntra",
        description: "Grab up to 70% off on all products during the online shopping sale.",
        image: "myntra.jpg",
        offerLink: "https://www.myntra.com/shop/offers",
        brandLink: "https://www.myntra.com"
    },
    {
        brand: "Amazon India",
        description: "Amazon Great Republic Sale: Huge discounts on electronics, fashion, and more!",
        image: "amazon.jpg",
        offerLink: "https://www.amazon.in/deals",
        brandLink: "https://www.amazon.in"
    },
    {
        brand: "Ajio",
        description: "Flat 50% off on top fashion brands, limited-time sale.",
        image: "ajio.jpg",
        offerLink: "https://www.ajio.com/sale",
        brandLink: "https://www.ajio.com"
    }
];


document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search");
    const offersContainer = document.getElementById("offersContainer");

    function renderOffers(filteredOffers) {
        offersContainer.innerHTML = filteredOffers.length ?
            filteredOffers.map(offer => `
                <div class="offer-card">
                    <h3><a href="${offer.brandLink}" target="_blank" class="brand-link">${offer.brand}</a></h3>
                    <img src="${offer.image}" 
                         alt="${offer.brand} Offer" 
                         class="offer-image"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/300x180?text=Image+Not+Available';" />
                    <div class="offer-card-content">
                        <p>${offer.description}</p>
                        <a href="${offer.offerLink}" target="_blank" class="offer-button">View Offer</a>
                    </div>
                </div>
            `).join('')
            : "<p class='no-results'>No offers found.</p>";
    }

    // Debounce search input to improve performance
    let searchTimeout;
    searchInput.addEventListener("input", function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = searchInput.value.toLowerCase();
            renderOffers(offers.filter(offer =>
                offer.brand.toLowerCase().includes(searchTerm) ||
                offer.description.toLowerCase().includes(searchTerm)
            ));
        }, 300);
    });

    // Initial render
    renderOffers(offers);
});