/* =========================================================
   GuruGram Saver AI - script.js
   Parts: 1) Data  2) Three.js 3D background  3) Scroll animations
          4) runComparison() + fetch to the Python backend
   ========================================================= */

/* ---------- PART 1: DATA (the backend contract - do not rename) ---------- */
const gurgaonData = {
    "Sector 55/56": {
        pg: { name: "Shanti Student Residency (Double)", price: 7500, avg: 10500, rating: "4.6★ Zero Brokerage" },
        tiffin: { name: "Annapurna Home Kitchen Sec-56", price: 2700, avg: 4200, rating: "4.8★ 2 Meals/Day" },
        salon: { name: "Cut & Style Local Studio Huda Mkt", price: 150, avg: 450, rating: "4.5★ Student Discount" }
    },
    "DLF Phase 3 / Cyber Hub": {
        pg: { name: "Metro View Co-Living U-Block", price: 8200, avg: 12000, rating: "4.4★ Free Wi-Fi + Power" },
        tiffin: { name: "Maa Ki Rasoi Phase-3", price: 2900, avg: 4500, rating: "4.7★ Free Delivery" },
        salon: { name: "Urban Trim Express Phase-3", price: 180, avg: 500, rating: "4.5★ Verified Hygiene" }
    },
    "Sector 14 / Old Gurgaon": {
        pg: { name: "Saha Scholar Boys/Girls PG", price: 6200, avg: 8500, rating: "4.7★ Near Main Market" },
        tiffin: { name: "Sharma Ghar Ka Khana Sec-14", price: 2400, avg: 3600, rating: "4.8★ Unlimited Roti/Rice" },
        salon: { name: "Classic Men & Women Salon Sec-14", price: 120, avg: 350, rating: "4.6★ Oldest Reliable Shop" }
    },
    "Sohna Road / Sector 48": {
        pg: { name: "GreenTech Student Stay Sec-48", price: 7000, avg: 9800, rating: "4.6★ Gated Society" },
        tiffin: { name: "HealthyBite Tiffin Service", price: 2600, avg: 4000, rating: "4.7★ Low Oil Home Cooked" },
        salon: { name: "LookWell Grooming Lounge", price: 150, avg: 400, rating: "4.5★ Fixed Rate Card" }
    }
};

/* Small helper: get an element by its id */
const $ = (id) => document.getElementById(id);

/* ---------- PART 2: THREE.JS 3D BACKGROUND ---------- */
// A "scene" is the 3D world, the "camera" is our eyes, the "renderer" draws it on the canvas.
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060f, 0.018); // distant things fade into darkness
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(0, 6, 20);
const renderer = new THREE.WebGLRenderer({ canvas: $("bg-canvas"), antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// The glowing floor grid
const grid = new THREE.GridHelper(400, 100, 0x00f0ff, 0x1a2a6c);
scene.add(grid);

// The skyline: many wireframe boxes of random height, like Gurgaon towers
const towerColors = [0x00f0ff, 0xff2e93, 0xb6ff3b];
for (let i = 0; i < 160; i++) {
    const h = 3 + Math.random() * 22;
    const box = new THREE.BoxGeometry(2 + Math.random() * 2, h, 2 + Math.random() * 2);
    const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(box),
        new THREE.LineBasicMaterial({ color: towerColors[i % 3], transparent: true, opacity: 0.55 })
    );
    // keep a lane in the middle empty so the camera can fly through it
    const side = Math.random() < 0.5 ? -1 : 1;
    edges.position.set(side * (7 + Math.random() * 40), h / 2, -Math.random() * 300 + 20);
    scene.add(edges);
}

// Floating neon data particles
const count = 900;
const pos = new Float32Array(count * 3);
for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 120;
    pos[i * 3 + 1] = Math.random() * 40;
    pos[i * 3 + 2] = -Math.random() * 300 + 20;
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x9ffcff, size: 0.25, transparent: true, opacity: 0.85 }));
scene.add(particles);

// Mouse position (-1 to 1) for the parallax effect
let mouseX = 0, mouseY = 0;
window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

// Animation loop: runs about 60 times a second
function animate() {
    requestAnimationFrame(animate);
    // How far the user has scrolled: 0 (top) to 1 (bottom)
    const max = document.body.scrollHeight - window.innerHeight;
    const progress = max > 0 ? window.scrollY / max : 0;
    // Scroll moves the camera forward through the city. Mouse nudges it for parallax.
    const targetZ = 20 - progress * 260;
    camera.position.z += (targetZ - camera.position.z) * 0.08;
    camera.position.x += (mouseX * 3 - camera.position.x) * 0.05;
    camera.position.y += (6 + progress * 4 - mouseY * 2 - camera.position.y) * 0.05;
    camera.rotation.z = Math.sin(progress * Math.PI * 2) * 0.05;
    camera.rotation.y = -mouseX * 0.05;
    particles.rotation.y += 0.0004;
    renderer.render(scene, camera);
}
animate();

// Keep the 3D scene the right size if the window changes
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- PART 3: SCROLL ANIMATIONS (GSAP ScrollTrigger) ---------- */
gsap.registerPlugin(ScrollTrigger);

// Hero text fades in once when the page loads
gsap.from(".hero > *", { y: 40, opacity: 0, duration: 1, stagger: 0.15, ease: "power3.out" });

// Problem section: stays pinned while the 3 cards fly in one by one
const flyIn = gsap.timeline({
    scrollTrigger: { trigger: "#problem", start: "top top", end: "+=1500", scrub: 1, pin: true }
});
flyIn.from(".pcard", { z: -800, rotationY: 60, y: 200, opacity: 0, stagger: 0.5, ease: "power2.out" });

// Command deck panel rises into view
gsap.from(".panel", { scrollTrigger: { trigger: "#deck", start: "top 75%" }, y: 80, opacity: 0, duration: 0.9 });

/* ---------- PART 4: COMPARISON LOGIC ---------- */
async function runComparison(fromClick) {
    // 1) Read what the user typed
    const sector = $("sectorSelect").value;
    const budget = Number($("budgetInput").value);
    const km = Number($("commuteInput").value);
    const question = $("questionInput").value;
    const info = gurgaonData[sector];

    // 2) Ride math (Rapido bike vs Uber auto vs Ola mini)
    const rapidoBike = Math.round(20 + (km * 7));
    const uberAuto = Math.round(35 + (km * 12));
    const olaMini = Math.round(60 + (km * 17));
    const totalMonthly = info.pg.price + info.tiffin.price + (rapidoBike * 2 * 22);

    // 3) Fill the cards
    $("pgName").innerText = info.pg.name;
    $("pgPrice").innerText = "₹" + info.pg.price.toLocaleString("en-IN") + "/mo";
    $("pgNote").innerText = info.pg.rating + " | Saves ₹" + (info.pg.avg - info.pg.price) + " vs avg ₹" + info.pg.avg;
    $("tiffinName").innerText = info.tiffin.name;
    $("tiffinPrice").innerText = "₹" + info.tiffin.price.toLocaleString("en-IN") + "/mo";
    $("tiffinNote").innerText = info.tiffin.rating + " | Saves ₹" + (info.tiffin.avg - info.tiffin.price) + " vs avg ₹" + info.tiffin.avg;
    $("rideName").innerText = "Rapido Bike (" + km + " km)";
    $("ridePrice").innerText = "₹" + rapidoBike + "/trip";
    $("rideNote").innerText = "Uber Auto ₹" + uberAuto + " | Ola Mini ₹" + olaMini;
    $("salonName").innerText = info.salon.name;
    $("salonPrice").innerText = "₹" + info.salon.price + "/cut";
    $("salonNote").innerText = info.salon.rating + " | Saves ₹" + (info.salon.avg - info.salon.price) + " vs avg ₹" + info.salon.avg;

    // 4) Budget progress bar (turns pink if we go over budget)
    const pct = Math.min((totalMonthly / budget) * 100, 100);
    $("budgetText").innerText = "Estimated cost ₹" + totalMonthly.toLocaleString("en-IN") + " of ₹" + budget.toLocaleString("en-IN") + " budget";
    $("budgetFill").classList.toggle("over", totalMonthly > budget);
    gsap.to("#budgetFill", { width: pct + "%", duration: 1, ease: "power2.out" });

    // 5) Celebration: flip the cards, then scroll to them (only when the user clicked)
    gsap.fromTo(".card", { rotationY: 180, scale: 0.8 }, { rotationY: 0, scale: 1, duration: 0.9, stagger: 0.12, ease: "back.out(1.7)" });
    if (fromClick === true) {
        $("results").scrollIntoView({ behavior: "smooth" });
        await askOllama(sector, budget, km, totalMonthly, rapidoBike, info, question);
    }
}

// Sends the data to the Python backend and shows the reply
async function askOllama(sector, budget, km, totalMonthly, rapidoBike, info, question) {
    const summaryText = "PG: " + info.pg.name + " ₹" + info.pg.price +
        ", Tiffin: " + info.tiffin.name + " ₹" + info.tiffin.price +
        ", Rapido ₹" + rapidoBike + "/trip, Total monthly ₹" + totalMonthly;

    $("aiStatus").innerText = "Neural net thinking...";
    document.querySelector(".term-head").classList.add("loading");
    $("aiOutput").innerText = "Loading";

    try {
        const response = await fetch("http://localhost:8000/ask-ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sector, budget, commute: km, summary: summaryText, question })
        });
        const data = await response.json();
        $("aiStatus").innerText = data.status;
        typeText(data.reply);
    } catch (err) {
        $("aiStatus").innerText = "Backend offline";
        $("aiOutput").innerText = "Could not reach http://localhost:8000. Start it with: python app.py";
    }
    document.querySelector(".term-head").classList.remove("loading");
}

// Types the reply one letter at a time
let typer;
function typeText(text) {
    clearInterval(typer);
    const box = $("aiOutput");
    box.innerText = "";
    let i = 0;
    typer = setInterval(() => {
        box.innerText += text.charAt(i++);
        if (i >= text.length) clearInterval(typer);
    }, 14);
}

// Fill the cards as soon as the page opens (no AI call, no scrolling)
runComparison(false);