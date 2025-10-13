# 8EH Radio ITB System Documentation

## System Overview

8EH Radio ITB is a comprehensive radio streaming platform that provides live radio streaming, podcast management, blog content, and URL shortening services. The system is built using Next.js with MongoDB database and implements role-based access control for administrative functions.

### Key Features
- Live radio streaming with fallback mechanisms
- Podcast management and playback
- Blog post management with author relationships
- URL shortening with click tracking
- Music chart (Tune Tracker) management
- Role-based admin dashboard
- Google OAuth 2.0 authentication
- Audio proxy for secure file access

## System Architecture

### Technology Stack
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: MongoDB with Prisma ORM
- **Authentication**: Google OAuth 2.0
- **File Storage**: Cloudflare R2
- **Audio Processing**: WaveSurfer.js, HTML5 Audio API

## Use Case Diagram

![Use Case Diagram](images/use-case-diagram.png)

## Class Diagram

![Class Diagram](images/class-diagram.png)

## Sequence Diagrams

### Public User Interactions

#### Play Radio Stream
![Play Radio Stream](images/sequence-1-play-radio-stream.png)

#### Sign in with Google
![Sign in with Google](images/sequence-2-signin-google.png)

#### Manage Podcasts
![Manage Podcasts](images/sequence-3-manage-podcasts.png)

#### Browse Podcasts
![Browse Podcasts](images/sequence-4-browse-podcasts.png)

#### Manage Short Links
![Manage Short Links](images/sequence-5-manage-shortlinks.png)

#### Open Short Link
![Open Short Link](images/sequence-6-open-shortlink.png)

#### Manage Blog Posts
![Manage Blog Posts](images/sequence-7-manage-blog-posts.png)

#### Control Playback
![Control Playback](images/sequence-8-control-playback.png)

#### Manage Tune Tracker
![Manage Tune Tracker](images/sequence-9-manage-tune-tracker.png)

#### Access Dashboard
![Access Dashboard](images/sequence-10-access-dashboard.png)

#### Browse Public Site
![Browse Public Site](images/sequence-11-browse-public-site.png)

#### View Tune Tracker
![View Tune Tracker](images/sequence-12-view-tune-tracker.png)

#### Play Tune Preview
![Play Tune Preview](images/sequence-13-play-tune-preview.png)

#### Play Podcast
![Play Podcast](images/sequence-14-play-podcast.png)

#### Proxy Audio
![Proxy Audio](images/sequence-15-proxy-audio.png)

#### Track Shortlink Clicks
![Track Shortlink Clicks](images/sequence-16-track-shortlink-clicks.png)

#### Manage Player Config
![Manage Player Config](images/sequence-17-manage-player-config.png)

#### Manage Stream Config
![Manage Stream Config](images/sequence-18-manage-stream-config.png)

#### Manage Users & Whitelist
![Manage Users & Whitelist](images/sequence-19-manage-users-whitelist.png)

#### View Dashboard Analytics
![View Dashboard Analytics](images/sequence-20-view-dashboard-analytics.png)

## Database Schema

### Core Models

#### User Model
```javascript
model User {
  id        String         @id @default(auto()) @map("_id") @db.ObjectId
  name      String?
  email     String?        @unique
  emailVerified DateTime?
  image     String?
  role      String         @default("KRU")
  createdAt DateTime       @default(now())
  authored  AuthorOnPost[]
  accounts  Account[]
  sessions  Session[]
  shortLinks ShortLink[]
  podcasts  Podcast[]
}
```

#### BlogPost Model
```javascript
model BlogPost {
  id          String         @id @default(auto()) @map("_id") @db.ObjectId
  title       String
  slug        String         @unique
  content     String
  description String?
  readTime    String?
  category    String?
  mainImage   String?
  tags        String[]
  isFeatured  Boolean        @default(false)
  authors     AuthorOnPost[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}
```

## API Endpoints

### Public Endpoints
- `GET /api/blog` - Retrieve blog posts
- `GET /api/podcast` - Retrieve podcasts
- `GET /api/tune-tracker` - Retrieve music chart
- `GET /api/stream-config` - Get stream configuration
- `GET /api/redirect/[slug]` - Redirect short links
- `GET /api/proxy-audio` - Proxy audio files

### Admin Endpoints
- `POST /api/blog` - Create blog post
- `PUT /api/blog/[slug]` - Update blog post
- `POST /api/podcast` - Create podcast
- `PATCH /api/podcast/[id]` - Update podcast
- `POST /api/shortlinks` - Create short link
- `PUT /api/shortlinks/[id]` - Update short link
- `PATCH /api/tune-tracker` - Update tune tracker
- `PATCH /api/users` - Update user roles

## Security Features

### Authentication
- Google OAuth 2.0 integration
- Email whitelist for access control
- JWT session management
- Role-based authorization

### Authorization
The system implements role-based access control with the following roles:
- **DEVELOPER**: Full system access
- **TECHNIC**: Technical configuration access
- **REPORTER**: Blog and content management
- **MUSIC**: Music and podcast management
- **KRU**: Basic access

## Conclusion

The 8EH Radio ITB system provides a comprehensive platform for radio streaming, content management, and administrative functions. The system architecture supports scalability, security, and maintainability through modern web technologies and best practices.
