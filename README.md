# Mi Nhon Hotel Mui Ne - Voice Assistant

A voice-powered web application for Mi Nhon Hotel Mui Ne, designed to streamline guest interactions through an intelligent, minimalist service interface with advanced call management and personalized user experience.

## Features

- AI-powered voice interface using Vapi.ai
- Real-time conversation transcription
- Multiple language support (English and Vietnamese)
- Automated service request categorization
- Intuitive, minimalist user interface
- Call history and order tracking
- Multiple service requests in a single conversation

## Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI Services**: OpenAI GPT-4o, Vapi AI
- **Languages**: TypeScript/JavaScript

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- OpenAI API key
- Vapi.ai API key and assistant ID

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/MiNhon-Hotel-MUiNe.git
   cd MiNhon-Hotel-MUiNe
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create `.env` file with the following variables:
   ```
   DATABASE_URL=your_postgresql_connection_string
   OPENAI_API_KEY=your_openai_api_key
   VITE_VAPI_PUBLIC_KEY=your_vapi_public_key
   VITE_VAPI_ASSISTANT_ID=your_vapi_assistant_id
   ```

4. Push database schema
   ```bash
   npm run db:push
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

## Usage

The application provides a simple interface for hotel guests to:
- Request room service, housekeeping, concierge services, etc.
- Get information about hotel amenities, local attractions, and more
- Make special requests or arrangements
- View conversation summaries in either English or Vietnamese

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## Contact

For inquiries, please contact us at [your-email@example.com](mailto:your-email@example.com)