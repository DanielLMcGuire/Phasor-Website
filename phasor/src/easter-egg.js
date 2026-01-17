let logo = document.getElementById("logo");
if (!logo) throw new Error("Logo element not found");
const breakAmount = Math.floor(Math.random() * (20 - 14 + 1)) + 14;
const spinAmount = Math.floor(Math.random() * (4 - 2 + 1)) + 2;
let clickCount = 0;

function logoFall() {
    if (logo.style.display === "none") {
        console.warn("Already fell!");
        return;
    }
    logo.classList.add("fall");
    setTimeout(() => {
        logoKill();
    }, 860);
}

function logoSpin() {
    logo.classList.remove("spin");
    void logo.offsetWidth; // Reset
    logo.classList.add("spin");
}

function logoKill() {
    logo.style.display = "none";
}

function logoReset() {
    if (logo.style.display !== "none") logoKill();
    logo.style.display = "";
    logo.classList.remove("fall");
    logo.classList.remove("spin");
    clickCount = 0;
}

function handleLogoClick() {
    clickCount++;
    if (clickCount === breakAmount)
        logoFall();
    else if (clickCount % spinAmount === 0) 
        logoSpin();
}

logo.addEventListener("click", handleLogoClick);