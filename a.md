Changes to be made:
NOTE: *** Make changes in the flow of how the user uses the website, from the start to end. ***

1)Sign up page and profile completion form right after sign up - Fill only required details and then ask the user(brand/influencer for profile completion -> Users can perfrom activities only when profile is complete)

2)Brand -
Profile -> Profile data should be presented as per the updated profile data in brand model and some of them must be updateable. Delete account(Check for any active campaigns/collaborations).

Explore -> Influencer matching, search and filter, invite influencers to campaign or 1-1 collaboration(Brand sends -> "Are you interested to collaborate with me, promote this product?", if influencer confirms, then list of deliverables will be given and this collaboration enters negotiation page, rest of the flow stays the same as campaign.).

Dashboard -> metrics(Will be decided by Snehith), active campaigns and collaborations(Similar to current functionality, but product details must be visible and also segregate campaign from collaborations, when campaign/collaboration is ended, make the brand complete the remaining payment with bonus(based on influencer performance)), product list(Functionality stays same but should have 'status'), orders(history + active(to be fulfilled)), payments(history + active(to be paid)),  campaign and collaboration history(Should be redirected to a new page, current functionality remains but with clearer influencer, product and order details)
before 2 days of any campaign ending, the brand will get a liberty to extend the time or end as previously stated, or he can end at any time after the deliverables are satisfied.

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

Transactions -> payment(Integrate Stripe API for payments. Brand makes payment to the influencer as specified, functionality significantly changes as payments can be made to influencer for campaign in two splits and also bonus is allowed. Brand will be asked to make the entire payment, either in splits or full, before the campaign is ended.).

negotioation: brand accept request and then provides the initial draft of deliverables to the influencer, then the conversation enters the negotiation page where they decide on final deliverables list, payment, bonus, split percentage. A simple message system should be implemented here. After the negotiation is done, we confirm the details(deliverables, payment_type and payment_amount from the brand for that influencer.). After this, brand can activate the campaign whenever he wants to.

3)Influencer -
Profile -> Profile data should be presented as per the updated fields in influencer model and some of them must be updateable. Delete account(Check for any active campaigns/collaborations).

Explore -> Brand matching, search and filter, request brand to promote their product(If brand  accepts, brand must provide the product with deliverables, then it enters negotiation page, rest of the flow stays same as campaign.), option to sort brands based on total campaign revenue and no of campaigns.

Dashboard -> metrics(will be decided by snehith), active campaigns and collaborations(products they are promoting, deliverables, their status and performance), sent requests(campaigns and collaborations),  received requests(campaigns and collaborations), products(list of products they promoted till date), payments history(money they've earned per campaign/collab), campaign and collaboration history(products they promoted)

Campaign/Collaboration applications -> Update the UI of the campaigns and campaign details page, add a new  filter 'suggestion for my profile' which would show the campaigns that the influencer meets requirements off.

Campaign/Collaboration negotiation -> Negotiate deliverables, payment split, bonus and payment. The inital base pay value shown as payment must calculated using the influencer's profile details(Price per post, price per reel etc.). 

4)Customer -
Campaign shopping -> Remove these fields: under what channels, budget, ends(as already how many days left) and description. 

Campaign's product + influencer content -> Remove description field.

Rankings -> Change total followers field to max followers over all social media channels.

Profile -> Display the customer details and manage connections section which contains a list of influencers/brands the customer follows, whenever the influencer posts content or brand launches a new campaign, the customer gets notifications. Connections are updateable(Addable and removable).

Orders -> Order tracking(Tracking will be simulated using the simulation service) + history (What you bought/done payment for).

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
Plans -> Enum - {free, basic, premium}, with their restrictions on campaigns/collaborations. Remove the list of features presented, because we're not giving any special features for subscribed people other than restrictions on campaigns/collaborations.

Current plan -> How many of the campaign and collaborations are used and how many are allowed, 
refresh usage button to fetch them on click.

Subscription payment history -> List the subscription payment history of the user.

Subscription payment -> Integrate Stripe API for payment.

7)User(Brand/Influencer/Customer/Admin) notifications -
Notification system -> Add notifications for all the important events. User read them, and notifications can redirect them to right locations.

9)Deliverable analytics simulation engine - Server uses cron job to run deliverables simulation service every 3 hrs and update the analytics of the active deliverables(Deliverables of active campaigns). The simulation engine must be realistic, taken into account the influencer profile, brand profile and the post.

10)Order tracking simulation engine - Server uses cron job to run oder tracking engine every 12 hrs to update the status of the orders which needs to be delivered. The delivery status should be set to 'delivered' by the max shipping days mentioned. The delivery time should taken into account the product starts from 'Hyderabad' center every time and reaches the customer, so based on location, delivery time must vary.

11)Chat system for every campaign - Every active campaign must have a chat system consisting of the brand and the set of influencers admitted for the campaign. They can communicate regarding the progress of campaign.