@src/components/Posts.jsx 
we need a wrapper around postheader, we dont want to display a list of raw post headers since we want to do a bit more here, we need a post preview component
i want that when u hover over any of these posts u get a faint background with rounded borders and also a button on the right showing an expand icon, when u click on the expand icon, the post preview box grows into a proper modal that is cented on the screen on top of everything else, but this transformation needs to be smooth and the positions of other stuff on the page should not be changed, so we need to be smart about thisim thinking we have have list placeholders that always stay in their place, then we have the post preview elemtnst on top of them, when u click on the expand button the post preview button has an animated transition to its "modal stage", btw in the modal stage we should stil have the post header component on top, but should also show the the article content too in the modal, we should actually just be display the proper mdx post component inside the modal, and we should have a nother expand icon that will smothly transition from there to the regular post page using famraer mothion for the whole mdx component so its a smooth transition, and we need a button from there to go to the article
also when the user goes from the preview to the article page itself that needs to happen smoothly
we need to do this all smart and clean as possible, i cant have my code becoming a mess



background
posts page background i want to be shades of white, very light grey, split into 6 parts, 
3 vertical parts and 2 horizantol parts
vertial should be first part like should be left 10% second part is next 70% third part is next 20%
horizantal should be frirst part is top 90% second part is bottom 10%
the parts should be very lightly colored and opacity of .1, they should overlap each other, theses are divs but they are serving as our background for the posts page, so this is like a background compoentn that is absolutely positioned on the page to cover the screen, but needs to remain behind all the other content on the page, 
needs to also be behind our home link in the bottom left or anything we may eventually place in the sidebar
needs to be done clean and simple as possible
on mobile we dont want all this.
actually i want whole mid to be white that way we can keep this bakgound all over even for out actuall posts pages


font:
we need to explore better fonts