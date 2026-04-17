const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// PASTE YOUR ACTUAL KEYS HERE (Copied from your .env.local)
const firebaseConfig = {
  apiKey: "AIzaSyC6Emt0xSsJ2xxZ91qKY16NCZYe8q_D4j8", // Your actual Key
  authDomain: "my-portfolio-dfd0d.firebaseapp.com",
  projectId: "my-portfolio-dfd0d",
  storageBucket: "my-portfolio-dfd0d.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seed() {
  // 1. Login (Replace with your actual admin email/password)
  const email = "abdullahalmazid.bd@gmail.com"; 
  const password = "Admin@1234"; 
  console.log("Logging in...");
  await signInWithEmailAndPassword(auth, email, password);
  console.log("Logged in. Seeding data...");

  // 2. Create Site Config (Navbar & Footer Data)
  const siteConfig = {
    brandName: "Abdullah.",
    tagline: "Full Stack Developer & Designer.",
    link_home: "Home",
    link_about: "About",
    link_projects: "Projects",
    link_experience: "Experience",
    link_publications: "Publications",
    link_gallery: "Gallery",
    link_contact: "Contact",
    socials: { github: '#', linkedin: '#' },
    contactEmail: 'hello@example.com',
    contactLocation: 'Dhaka, Bangladesh',
    theme: 'warm-sand'
  };

  await setDoc(doc(db, 'settings', 'site_config'), siteConfig, { merge: true });
  console.log("✅ SUCCESS: Navbar and Footer data created!");
  console.log("Refresh your browser page to see the text.");
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ ERROR:", e.message);
  process.exit(1);
});