import "./style.css";

const memeAPI: string = "https://api.imgflip.com/get_memes";

const inputTop = document.getElementById("input-top-text") as HTMLInputElement;
const inputBottom = document.getElementById(
  "input-bottom-text",
) as HTMLInputElement;
const goButton = document.getElementById("submit") as HTMLButtonElement;
const memeSection = document.getElementById("meme") as HTMLElement;
let prevFetchTime: Date | undefined;
let memeList: Meme[] | undefined;

inputBottom.addEventListener("keydown", handleNewInput);
inputTop.addEventListener("keydown", handleNewInput);
goButton.addEventListener("click", handleNewInput);

// Information for each meme image
interface Meme {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
  captions: number;
}

// Array of memes is encapsulated in an object in the API response
interface MemeObject {
  memes: Meme[];
}

interface MemeApiResponse {
  success: boolean;
  data: MemeObject;
}

// Fetch API data from the meme API
async function callMemeApi(): Promise<MemeApiResponse> {
  try {
    const response = await fetch(`${memeAPI}`);
    if (!response.ok) {
      throw new Error(`HTTP error: status: ${response.status}`);
    }
    const data: MemeApiResponse = await response.json();
    return data;
  } catch (error) {
    console.log("There was an API error!");
    throw error;
  }
}

// Extract the array of memes from the meme API response
function extractMemeList(apiResponse: MemeApiResponse): Meme[] | undefined {
  return apiResponse?.data?.memes;
}

// Helper function: create text divs for the meme image text and apply proper styling
function createTextDiv(text: string, position: string): HTMLElement {
  const outerTextDiv = document.createElement("div") as HTMLElement;
  const innerTextDiv = document.createElement("div") as HTMLElement;

  outerTextDiv.classList.add(
    "w-full",
    "absolute",
    "flex",
    "items-center",
    "justify-center",
  );
  if (position === "top") {
    outerTextDiv.classList.add("top-5");
  } else if (position === "bottom") {
    outerTextDiv.classList.add("bottom-5");
  }

  innerTextDiv.textContent = text;
  innerTextDiv.classList.add(
    "text-white",
    "black-text-shadow",
    "font-bold",
    "text-center",
  );

  outerTextDiv.append(innerTextDiv);

  return outerTextDiv;
}

// Render random meme image with provided top and bottom text
function displayMeme(
  topText: string,
  bottomText: string,
  memeList: Meme[],
): void {
  const randomMemeIndex: number = Math.floor(Math.random() * memeList.length);
  const randomMeme: Meme = memeList[randomMemeIndex];

  removeMeme(); // clear any previous meme images or text
  memeSection.classList.add("bg-black", "relative", "text-4xl");

  const memeImg = document.createElement("img") as HTMLImageElement;
  memeImg.src = randomMeme.url;
  memeImg.alt = randomMeme.name;
  memeImg.classList.add("mx-auto");

  memeSection.append(memeImg);

  const topTextDiv: HTMLElement = createTextDiv(topText, "top");
  const bottomTextDiv: HTMLElement = createTextDiv(bottomText, "bottom");

  memeSection.append(topTextDiv);
  memeSection.append(bottomTextDiv);
}

// Remove meme image, including previous top and bottom text
function removeMeme(): void {
  memeSection.innerHTML = "";
}

// Helper function: render input box colors based on whether text was provided or not
function renderInputColors(topText: string, bottomText: string): void {
  if (!topText && bottomText) {
    // top text missing, bottom text provided
    inputTop.classList.remove("border-stone-200");
    inputTop.classList.add("border-red-500");
    inputBottom.classList.remove("border-red-500");
    inputBottom.classList.add("border-stone-200");
  } else if (!bottomText && topText) {
    // bottom text missing, top text provided
    inputBottom.classList.remove("border-stone-200");
    inputBottom.classList.add("border-red-500");
    inputTop.classList.remove("border-red-500");
    inputTop.classList.add("border-stone-200");
  } else if (!topText && !bottomText) {
    // both top text and bottom text missing
    inputTop.classList.remove("border-stone-200");
    inputTop.classList.add("border-red-500");
    inputBottom.classList.remove("border-stone-200");
    inputBottom.classList.add("border-red-500");
  } else if (topText && bottomText) {
    inputTop.classList.remove("border-red-500"); // both top text and bottom text provided
    inputTop.classList.add("border-stone-200");
    inputBottom.classList.remove("border-red-500");
    inputBottom.classList.add("border-stone-200");
    document.getElementById("error")!.textContent = "";
  }
}

// Helper function: Render meme or display error messages after user indicates new input
async function handleNewInput(event: KeyboardEvent | Event) {
  const topText: string = inputTop.value.trim().toUpperCase();
  const bottomText: string = inputBottom.value.trim().toUpperCase();

  if (
    ((<Event>event).target as HTMLButtonElement).id === "submit" ||
    (<KeyboardEvent>event).key === "Enter"
  ) {
    // typecasting event ensures both hitting "Enter" and clicking "Go!" button work
    if (!topText || !bottomText) {
      document.getElementById("error")!.textContent =
        "Please enter text in both input fields!";
      removeMeme();
      renderInputColors(topText, bottomText);
      return;
    }

    renderInputColors(topText, bottomText);

    try {
      const currentTime: Date = new Date();
      if (
        !prevFetchTime ||
        (currentTime.getTime() - prevFetchTime.getTime()) / (1000 * 60 * 60) >=
          24
      ) {
        // re-fetch API data if it was been 24 hours or more
        console.log("fetching from Api");
        prevFetchTime = new Date();
        const data = await callMemeApi();
        memeList = extractMemeList(data);
      }

      if (!memeList) {
        // list of memes cannot be empty
        throw new Error("List of memes extracted from API is empty");
      }

      displayMeme(topText, bottomText, memeList);
    } catch (error) {
      removeMeme();
      document.getElementById("error")!.textContent =
        "An error occurred while fetching memes!";
      console.error("Error: ", error);
    }
  }
}
