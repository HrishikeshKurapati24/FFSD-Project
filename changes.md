brand invite invitation, 
collaboration, 
at present(linking, )
it should be either (linking to particular campaign, or make a collaboration)

influencer for content for verifying for brand,
they'll attach for particular deliverable, and sent for feedback, 
if post/jvndn is rejected how we can send the feedback, 
-
***If Aashna Shroff gets the deliverables, then they've to be able to get the  Video, then there should be a table, 
where we need feedback, for what deliverable and for what video, 
after publish, the previous content will removed from database,***

***implement the realistic stats engine, we need to simulate, for perticular time period we need to fetch and the updated by that time, ***

The campaign must end if the end date has passed or manually closing by brand after all deliverables have been published.

If the influencer meets all the performance requirements, a bonus will be given by the brand.

The commission earned for the products should be our company's revenue and not influencer's revenue.

The customer's payment details should be stored in our database.
Integrate Stripe API for product purchase and influencer-brand campaign payment transactions.
After the campaign has ended, the brand will give rating to the influencer and vice versa.(Think about it->What if both of them come to an agreement to give higher ratings for each other!!!!)

reduce the functionalities, may not be pages,

in explore pages, we also need previously collaborated filters.


works to do:-

1) campaign should require less info to be filled by the brand.(Brand pages)

2) negotiation between influencer, brand (on money).(can use chat system).
negotiation should be done.(Brand and influencer pages)

3) which KPI could be used in our project that's both relevant and gives good results.
(to put in resume).(???)

4) influencer can have the choice of choosing the split(60/40 or 70/30 or 50/50), if it's cancelled the brand won't get any refund amount due to integrity issues.(Brand and influencer pages)

5) instead of fixing the no of influencers by the brand in the collab page, we can flexible opportunity.(Brand pages)

6)Implement a realistic simulation service to simulate the deliverable performance.(Influencer pages)

7) Flow:-

brand-create campaign -> influencer sends the request by seeing base price(certain amount of estimated price) -> negotiation -> accepting influencers -> first payment -> campaign creation


8) prevent fraud(do some action against frauds)(Admin pages)

9) Verification System (Anti-Fake)(Admin pages)(Need to clear on how we'll build it)

The platform checks:

API follower data, Sudden growth spikes, Bot detection, Fake likes detection, If fraud detected → Account flagged.

key identification metrics:- Profile Completeness, Follower-to-Following Ratio,  Activity Patterns, Username Anomalies, Engagement Discrepancy

10) Influencer Profile & Verification
Every influencer gets a digital portfolio.
🔹 Profile Contains
Social media accounts
Audience demographics
Average reach
Past collaborations
Price per post(should be in influencer profile)
Ratings

11) I want to join → My price → My ideas(campaign applications by influencer should contain this)(Influencer pages)

12) Brands can search by:
 Country, Language, Niche, Followers, Engagement rate, Gender of audience, Age group
(slide down button for options having fixed values , eg:- Country, lang, niche)
we need to create regex based filtering for age range etc.
and find the right influencers to collaborate with(Brand pages)

13)update influencer invite brand functionality:- influencer don't have to select a product to send invite to brand, they can send that they are interested to work for brand.
Brand after receiving the interest request from influencer(collaboration 1-1),
the schema for this 1-1 collaboration will be different , only list of products will be given and no campaign will be required. create entire collaboration workflow.



completed till 4

 show the analytics in the form of complex graphs/charts rather than numbers 6.

 Things to do in admin:-(by snehith)

 1) what should be there in admin-dashboard
    According to sir, every dashboard is a subset of admin dashboard.
    There should'nt be anything the admin couldn't see but other user can see, but viceversa is not possible.

 2) Remove all the mock data, there should only be data fetched from the
    schema's and controllers.

 3) Total no of influencers, brands and customers ; 
 graph :- Total Revenue Generated, Collaboration Status Distribution(remove the cards having data active, completed, pending collabs).

 4) Remove these graphs(User Growth Over Time, Platform Performance).

 5) Remove the top Performers Section in the Admin Dashboard section.(Because they are already in brand/influencer analytics pages)

 6) keep the Overall User Details into the admin main dashboard, merge them somehow so that finally we'll have less no of cards including Overall User Details and Detailed Analytics Dashboards. Don't keep any duplicate cards. 

 7) Remove the Brand loyalty index

 8) Remove the engagemnent Rate column in Top Performing Brands section, replace with something useful

 9) Remove the influencer categories section in InfluencerAnalytics.jsx page

 10) replace the col Commission earned with revenue in InfluencerAnalytics.jsx page

 11) Remove CampaignAnalytics page and move the required data into CollaborationMonitoring page

 12) Introduce a Campaign Monitoring page.

 13) Create two seperate tables, one for product list and one for product order details.

 14) merge UserAnalytics and CustomerManagement into UserManagement.jsx

 15) keep the table in ProductAnalytics.jsx in the PaymentVerification.jsx page. (in one table we can't understand who brought the product, in anotehr table we can't know what brand product a person bought)

 16) Fix the notification functionality.