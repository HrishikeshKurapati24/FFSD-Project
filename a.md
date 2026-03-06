Changes to be made:
NOTE: *** Make changes in the flow of how the user uses the website, from the start to end. ***

1)Sign up page and profile completion form right after sign up -
2)Brand -
Profile -> profile data should be presented as present in brand model and some of them must be updateable.

Explore -> Influencer matching, search and filter, invite influencers to campaign or 1-1 collaboration(Brand sends -> "Are you interested to collaborate with me, promote this product?")

Dashboard -> metrics(Will be decided by Snehith), active campaigns and collaborations(Similar to current functionality, but product details must be visible and also segregate campaign from collaborations, when campaign/collaboration is ended, make the brand complete the remaining payment with bonus(based on influencer performance)), product list(Functionality stays same but should have 'status'), orders(history + active(to be fulfilled)), payments(history + active(to be paid)),  campaign and collaboration history(Should be redirected to a new page, current functionality remains but with clearer influencer, product and order details)
before 2 days of any campaign ending, the brand will get a liberty to extend the time or end as previously stated, or he can end at any time after the deliverables are satisfied, 

Campaign applications -> campaign and collaboration requests(Deliverable and payment negotiation should be present here, after accepting sufficient influencers and completion of negotitation, brand accepts the influencer to the campaign, which would redirect them to transactions page),

Create campaign ->  Should contain these fields(
title, 
description, 
start_date, 
end_date, 
categories(options to select from),
budget, 

required_channels & min_followers: {array of objects, platform, min_followers}
objectives, Product(name_product, 
description, 
images   --- to show for the influencer and the brand, 
original_price, 
campaign_price, 

category {fasion, beauty, games, accessories, etc, }
target_quantity
sold_quantity

delivery_info {have estimated days, shipping cost, }))

Transactions -> payment(Integrate Stripe API for payments. Brand makes payment to the influencer as specified, functionality significantly changes as payments can be made to influencer for campaign in two splits and also bonus is allowed. Brand will be asked to make first half of payment before the campaign starts, and the second half whenever he wants to, but must finish it within 5 days of ending a campaign. If the brand chooses full payment, they can do it )

negotioation: brand accept request -> deliverables -> negotiation -> payment(if required)-> activation campaign(by brand)
these entries must be prone to changes: split percentage, deliverables, total prize, 
simple messages system, (think about wether we can use a regular expression parssing, )
the first money should be paid before campaign, the rest of the payment should be done before ending the campaign, 

3)Influencer -
Profile -> profile data should be presented as present in influencer model and some of them must be updateable.

Explore -> Brand matching, search and filter, request brand to promote their product, sorting based on previous revenue or no of campaigs,

Dashboard -> metrics(will be decided by snehith), active campaigns and collaborations(products they are promoting, deliverables, their status and performance), sent requests(campaigns and collaborations),  received requests(campaigns and collaborations), products(list of products they promoted till date), payments history(money they've earned per campaign/collab), campaign and collaboration history(products they promoted)

Campaign/Collaboration applications -> Apply, Updata the UI of the http://localhost:5173/influencer/collab/69a72c80e53a333c2299076a, and http://localhost:5173/influencer/campaigns, suggestion for my profile(with my catogories(generalise) and meet the requirements of the campaign, )

Campaign/Collaboration negotiation -> Negotiate deliverables and payment
in the brand creation deliverable, there should a base pay, it should be calculated based the prise per post/reel in profile, 

4)Customer -
Campaign shopping -> list all the active campaign, and able see which influencer is campaigning,  how many days left, 
remove: under what channels, budget, ends: (as already how many days left, ), description, 

Campaign's product + influencer content -> see their content, 
keep some posts(add some data these fields are empty over the website) 
remove: description, 

Rankings -> 
users should be able to see the top performing brands and influencer in our wesite, based on the factors: {campaign revneue, engagement rate, rating, compleated campaign} for brands and {followers, engagement rate, platform count} for influencers, 
we can't get the total followers change it to max followers in one field, 
they could see their previous colloborations, and promoted products, and some meta data about them, 
-
for perticular brands many active campaigns are shown as active, but they are not being shown in the all campaigns page, they is some inconsistency, 

Profile ->display the name, payment details, picture, 
manage_connections(whom you follow, if some activity of them is present then I'll be shown at the top, here you can manage those connection, )
in this page the user should be able to change whom they follow in our website, (follow, unfollow, )

Orders -> Order History (what you bought/done payment for)
simulation(done by hrishikesh)

5)Admin -
Dashboard ->Revenue Analytics{Commission Overview, Recent Transactions}
Performance Analytics Dashboard, 

listing Top Performers, 

Users -> Verify the users(The users(brand/influencer) upon registration should be partially verified using simple checks and then fully verified by admin, the user can use only some of the website's functionalities(Subscription, campaign/collaboration creation, campaign/collaboration application are not allowed))

merge the Analytics and management pages, 
only few pages should be there: 
Influencer management, (merge the InfluencerAnalytics at the top)
Brand Management, (merge the BrandAnalytics at the top)
Collaboration management, (merge the CollabotationAnalytics at the top)
products Management, (merge the ProductsAnalytics at the top)

Influencer analytics:
Top Performing Influencers, 

Product Analytics-> showing metrics {products sold, total revenue generated, avg revenue, }
didn't implement the logic that after the collaboration is ended then the product should be inactive, 
but we didn't get any revenue from the products, so add a commision for products also to fill these revenue only from products, 
Product Performance: lists all the prodics in sorting order, 

Campaigns ->TOTAL CAMPAIGNS, ACTIVE CAMPAIGNS, CAMPAIGN SUCCESS RATE(how are we deciding this/wether the deliverables are being met, but if theyaren't met then can we still end the campaig, ), 
Top Performing Campaigns (instead name it as all campaigs sorted, )

Payments -> {TRANSACTION ID	DATE	BRAND	INFLUENCER	CATEGORY	AMOUNT	STATUS	ACTIONS}

Feedback -> {ID	USER	TYPE	SUBJECT	DATE	STATUS	ACTIONS}
status should be able to be changed, right, 
there a new field should be there, where when the feedback cam and who(admin, ) and when resolved (timestamps)

6)User(Brand/Influencer) subscription -
Plans -> enum:{free, basic, premium}, with their restrictions, 
remove the list of features presented, because we're not giving any special section for subscribed people, 
or add a section where you show some analytics more subscribed people, 
shouldn't be able to downgrade the subscription, 

Current plan -> how many of the campaign and collaborations are used and how many are allowed, 
refresh usage button to fetch them at hand, 

Subscription payment history -> fetching: date, plans, cycle(if chosen, ), amount, status, paymentmethod, 
need to take this billing_cycle field, 

Subscription payment -> fetch required , stripe integration, 

7)User(Brand/Influencer/Customer/Admin) notifications -
Notification system -> Add notifications for all the important events. User read them, and notifications can redirect them to right locations.

9)Deliverable analytics simulation engine -

10)Order tracking simulation engine -

11)Chat system for every campaign -