#clerk webhook secret

Setup Clerk Webhook:

Clerk Dashboard → Developers → Webhooks → Add endpoint
URL: http://localhost:3000/api/webhooks/clerk
Events: user.created
Copy signing secret → add to .env.local as CLERK_WEBHOOK_SECRET

Subscribe to events — scroll down and check these:
✅ user.created
✅ invitation.accepted  (good to have)

Click Create at the bottom. 


Note — localhost webhook won't work from Clerk's servers. For local testing use ngrok:
ngrok http 3000

Use the ngrok URL in Clerk instead:
https://abc123.ngrok.io/api/webhooks/clerk
For production → use your VPS URL:
http://72.61.246.199:3001/api/webhooks/clerk


# Phase 2 -DB Migration from Supabase to Postgres(locally) using Docker.

1. touch docker-compose.yml

[
git pull                    # get code
docker-compose up -d        # start postgres
npm install                 # install packages  
npm run db:migrate          # create tables
npm run dev                 # start app
]

2. After Pasting content in .yml the run this : 

   docker-compose up -d
   
   # Other Docker commands 

   # Stop but keep data
    docker-compose stop

    # Stop AND remove containers (data still safe in volume)
    docker-compose down

    # Stop AND remove everything including data ⚠️
    docker-compose down -v

3. Adding Drizzle 

    npm install drizzle-orm pg
    npm install -D drizzle-kit

4. # after adding the schema in schema.js 

    Now generate the migration: npx drizzle-kit generate 

    the run : npx drizzle-kit migrate