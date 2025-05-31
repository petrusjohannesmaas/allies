# Allies

## Overview

**Allies** is an application designed to help users keep track of their obligations and maintain basic information about their friends and family. The app will provide a user interface for seamless interaction while ensuring security and usability across multiple phases of development.

## Data Structure

An example **Ally** object:
```json
{
	"ally": {
        "category": "",
		"basic_info": {
			"fname": "",
			"lname": "",
			"email": "",
			"birthday": "",
			"pfp": ""
		},
		"missions": [{}, {}],
		"note": ""
	}
}
```

Each ally contains:
- **Category**: A string representing the category of ally (e.g., family member, friend, etc.).
- **Basic Info**: First name, last name, email, birthday, profile picture.
- **Missions**: A list of commitments or obligations with a description and due date.
- **Note**: General notes related to the ally.

## Development Phases

### Phase 1: Server-side development
- Implement API endpoints with a working local copy.
- Interact with the API using an HTTP client.

### Phase 2: Client-side development
- Build a front-end interface for seamless interaction.
- Ensure usability and responsiveness.

### Phase 3: Containerization
- Deploy API and client in **Docker** containers.
- Implement persistent storage solutions.
- Add the project to the portfolio and make it public.

### Phase 4: Security
- Integrate **JWT** for authentication.
- Apply encryption for data security.

### Phase 5: Cloud Deployment
- Deploy the application to a cloud provider.
- Ensure availability and scalability.

### Phase 6: OAuth Integration
- Enable **OAuth** authentication for seamless logins.
- Re-deploy with new authentication mechanisms.

### Phase 7: Mobile Application
- Develop a **cross-platform** mobile client.
- Integrate with the cloud-hosted server.

## Future Plans
- Enhancing the user experience with AI-powered suggestions.
- Expanding features for obligation tracking.
- Potential support for notifications and reminders.

---

## **Technologies**

### **Core Language & Tools**
- **TypeScript** – Static typing ensures maintainability and scalability.
- **Deno** – Secure-by-default runtime with ES module support and no npm requirement.
- **Vite** – Fast and optimized development tooling for frontend projects.

### **Backend Stack**
- **PostgreSQL** – Relational database with JSONB support for flexible data storage.
- **DenoDB ORM** – Object-relational mapping for structured data management.
- **Deno HTTP Module** – Native HTTP server for handling API requests efficiently.

### **Frontend Stack**
- **React** – Component-based UI framework for interactive applications.
- **Bulma** – Modern CSS framework for responsive design.

---

### Installation

Not currently available.

---

### License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for more information.