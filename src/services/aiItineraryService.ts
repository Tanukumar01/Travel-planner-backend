import path from "path";
import crypto from "crypto";


type ExtractedData = {
    documentType: string;
    probableDestination: string;
    travelDates: string[];
    providers: string[];
    confirmationCodes: string[];
    importantNotes: string[];
    rawSummary: string;
};

type ItineraryPlan = {
    title: string;
    summary: string;
    travelWindow: string;
    destinations: string[];
    checklist: string[];
    days: Array<{
        day: number;
        title: string;
        location: string;
        agenda: string[];
        notes: string[];
    }>;
};

type ProcessedDocument = {
    extractedText: string;
    extractedData: ExtractedData;
    itinerary: ItineraryPlan;
    shareId: string;
};

type OpenAiResponse = {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
};

const DATE_REGEX =
    /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,\s+\d{4})?)\b/gi;
const CONFIRMATION_REGEX = /\b[A-Z0-9]{5,10}\b/g;

const buildHeuristicExtraction = (
    originalName: string,
    extractedText: string
): ExtractedData => {
    const combinedText = `${originalName}\n${extractedText}`;
    const textLower = combinedText.toLowerCase();

    let documentType = "travel document";
    if (textLower.includes("flight") || textLower.includes("boarding")) {
        documentType = "flight ticket";
    } else if (textLower.includes("hotel") || textLower.includes("check-in")) {
        documentType = "hotel booking";
    } else if (textLower.includes("train") || textLower.includes("rail")) {
        documentType = "train ticket";
    }

    const travelDates = Array.from(
        new Set((combinedText.match(DATE_REGEX) ?? []).slice(0, 5))
    );
    const confirmationCodes = Array.from(
        new Set((combinedText.match(CONFIRMATION_REGEX) ?? []).slice(0, 6))
    );

    const probableDestinationMatch =
        combinedText.match(/\bto\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/) ??
        combinedText.match(/\bhotel\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/);

    const probableDestination =
        probableDestinationMatch?.[1] ??
        path.basename(originalName, path.extname(originalName)).replace(/[-_]/g, " ");

    const providers = Array.from(
        new Set(
            [
                "indigo",
                "air india",
                "vistara",
                "spicejet",
                "booking.com",
                "makemytrip",
                "goibibo",
                "oyo",
                "marriott",
                "airbnb",
            ].filter((provider) => textLower.includes(provider))
        )
    );

    const importantNotes = [
        documentType === "flight ticket"
            ? "Double-check baggage allowance and web check-in timing."
            : "Keep a digital copy of the booking handy during travel.",
        travelDates.length
            ? `Travel dates found: ${travelDates.join(", ")}`
            : "No clear travel dates were extracted from the document.",
    ];

    const rawSummary =
        extractedText.trim().slice(0, 600) ||
        `Uploaded ${documentType} named ${originalName}.`;

    return {
        documentType,
        probableDestination,
        travelDates,
        providers,
        confirmationCodes,
        importantNotes,
        rawSummary,
    };
};

const buildFallbackItinerary = (data: ExtractedData): ItineraryPlan => {
    const destination = data.probableDestination || "your destination";
    const travelWindow =
        data.travelDates.length > 0
            ? data.travelDates.join(" to ")
            : "Dates to be confirmed from the booking";
    const providerText = data.providers.length
        ? data.providers.join(", ")
        : "the uploaded booking provider";
    const confirmationText = data.confirmationCodes.length
        ? data.confirmationCodes.join(", ")
        : "not clearly detected";

    return {
        title: `Trip plan for ${destination}`,
        summary:
            `A clear travel plan for ${destination}. It uses the uploaded ${data.documentType}, extracted dates, provider clues, and confirmation details to guide the traveler from pre-trip preparation through arrival, daily planning, and departure.`,
        travelWindow,
        destinations: [destination],
        checklist: [
            `Save the booking document offline and keep confirmation code(s) ready: ${confirmationText}.`,
            `Reconfirm timings with ${providerText} at least 24 hours before travel.`,
            "Carry a valid government ID, payment method, emergency contacts, and any visa or entry documents.",
            "Keep a 45-90 minute buffer for airport, station, hotel check-in, traffic, and security queues.",
            "Share the itinerary link with a trusted person before departure.",
        ],
        days: [
            {
                day: 1,
                title: "Arrival, transfer, and check-in",
                location: destination,
                agenda: [
                    `Morning: Review the uploaded ${data.documentType}, verify the travel date/window (${travelWindow}), and keep ID plus booking proof ready.`,
                    "Arrival block: Complete the main transfer first. Prioritize reaching the hotel/stay or onward connection before planning anything optional.",
                    "Check-in block: Confirm room, seat, baggage, pickup, or next connection details. Take screenshots of important addresses and phone numbers.",
                    "Evening: Keep the first day light. Find food, water, pharmacy/ATM, and the easiest route back to the stay.",
                ],
                notes: data.importantNotes,
            },
            {
                day: 2,
                title: "Main travel or exploration day",
                location: destination,
                agenda: [
                    "Start of day: Check weather, local transport options, and whether any booking time has changed.",
                    "Primary plan: Complete the most important activity, meeting, sightseeing block, or onward travel first while energy is high.",
                    "Midday: Keep a proper meal break and avoid scheduling back-to-back activities without travel time.",
                    "Evening: Reconfirm the next day departure/check-out timing and pack documents in one place.",
                ],
                notes: [
                    "Use extracted booking references if you need customer support.",
                    "Keep 30-60 minutes of buffer between major activities.",
                    "If the document has incomplete dates, manually verify timings before leaving.",
                ],
            },
            {
                day: 3,
                title: "Departure readiness and wrap-up",
                location: destination,
                agenda: [
                    "Morning: Pack essentials, check drawers/chargers/documents, and review the final route to the airport, station, or bus point.",
                    "Before leaving: Confirm check-out, payment, luggage, tickets, and transport pickup/drop location.",
                    "Transfer: Leave early enough for traffic, queues, security, and unexpected delays.",
                    "After trip: Save receipts, booking confirmations, and any useful notes for future reference.",
                ],
                notes: [
                    "Keep ID and ticket/booking proof easily accessible until the journey is fully complete.",
                    "If travel dates were not extracted clearly, treat all timings as needing manual confirmation.",
                ],
            },
        ],
    };
};

const normalizeList = (
    value: unknown,
    fallback: string[],
    minItems: number
): string[] => {
    const entries = Array.isArray(value)
        ? value.map(String).map((entry) => entry.trim()).filter(Boolean)
        : [];

    return entries.length >= minItems ? entries : fallback;
};

const normalizeItinerary = (
    parsed: Record<string, unknown>,
    extractedData: ExtractedData
): ItineraryPlan => {
    const fallback = buildFallbackItinerary(extractedData);
    const parsedDays = Array.isArray(parsed.days) ? parsed.days : [];
    const normalizedDays = parsedDays.map((day, index) => {
        const safeDay = day as Record<string, unknown>;
        const fallbackDay = fallback.days[index] ?? fallback.days[fallback.days.length - 1];

        return {
            day: Number(safeDay.day ?? index + 1),
            title: String(safeDay.title ?? fallbackDay.title),
            location: String(safeDay.location ?? fallbackDay.location),
            agenda: normalizeList(safeDay.agenda, fallbackDay.agenda, 4),
            notes: normalizeList(safeDay.notes, fallbackDay.notes, 2),
        };
    });

    return {
        title: String(parsed.title ?? fallback.title),
        summary: String(parsed.summary ?? fallback.summary),
        travelWindow: String(parsed.travelWindow ?? fallback.travelWindow),
        destinations: normalizeList(parsed.destinations, fallback.destinations, 1),
        checklist: normalizeList(parsed.checklist, fallback.checklist, 5),
        days: normalizedDays.length >= 3 ? normalizedDays : fallback.days,
    };
};

const tryParseJson = (value: string): Record<string, unknown> | null => {
    const direct = value.trim();

    try {
        return JSON.parse(direct) as Record<string, unknown>;
    } catch {
        const match = direct.match(/\{[\s\S]*\}/);
        if (!match) {
            return null;
        }
        try {
            return JSON.parse(match[0]) as Record<string, unknown>;
        } catch {
            return null;
        }
    }
};

const readPdfText = async (fileBuffer: Buffer): Promise<string> => {
    const buffer = fileBuffer;
    // Dynamically import pdf-parse only when needed to prevent Vercel boot-time issues
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();

    if ("destroy" in parser && typeof parser.destroy === "function") {
        await parser.destroy();
    }

    return parsed.text ?? "";
};

const callOpenAiForImageExtraction = async (
    fileBuffer: Buffer,
    fileType: string,
    originalName: string
): Promise<ExtractedData | null> => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || !fileType.startsWith("image/")) {
        return null;
    }

    const base64Image = fileBuffer.toString("base64");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
            temperature: 0.2,
            messages: [
                {
                    role: "system",
                    content:
                        "Extract travel booking details from the provided image and return strict JSON with keys: documentType, probableDestination, travelDates, providers, confirmationCodes, importantNotes, rawSummary.",
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Document file name: ${originalName}`,
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${fileType};base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
        }),
    });

    if (!response.ok) {
        return null;
    }

    const payload = (await response.json()) as OpenAiResponse;
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
        return null;
    }

    const parsed = tryParseJson(content);

    if (!parsed) {
        return null;
    }

    return {
        documentType: String(parsed.documentType ?? "travel document"),
        probableDestination: String(parsed.probableDestination ?? "Destination"),
        travelDates: Array.isArray(parsed.travelDates)
            ? parsed.travelDates.map(String)
            : [],
        providers: Array.isArray(parsed.providers)
            ? parsed.providers.map(String)
            : [],
        confirmationCodes: Array.isArray(parsed.confirmationCodes)
            ? parsed.confirmationCodes.map(String)
            : [],
        importantNotes: Array.isArray(parsed.importantNotes)
            ? parsed.importantNotes.map(String)
            : [],
        rawSummary: String(parsed.rawSummary ?? ""),
    };
};

const callOpenAiForItinerary = async (
    extractedData: ExtractedData
): Promise<ItineraryPlan | null> => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return null;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
            temperature: 0.5,
            messages: [
                {
                    role: "system",
                    content:
                        [
                            "You are an expert travel planner for a consumer travel dashboard.",
                            "Create a clear, detailed, beginner-friendly itinerary from extracted booking data.",
                            "Return strict JSON only. Do not use markdown. Do not wrap the JSON in code fences.",
                            "Required top-level keys: title, summary, travelWindow, destinations, checklist, days.",
                            "The summary must explain the trip context in 2-3 plain sentences: destination, travel window, document type, and what the plan helps the user do.",
                            "The checklist must contain 5-7 practical preparation items. Mention confirmations, ID/documents, timing buffers, offline copies, and support contacts when useful.",
                            "Create exactly 3 days unless the booking clearly gives a different trip length.",
                            "Each day must include: day, title, location, agenda, notes.",
                            "Each agenda must contain 4-6 clear steps in chronological order. Prefer time blocks such as Morning, Arrival, Afternoon, Evening, or Before leaving.",
                            "Each agenda item must be understandable without seeing the original document. Include concrete user actions and why they matter.",
                            "Each notes array must contain 2-4 short traveler tips, warnings, or reminders.",
                            "If data is missing, say what should be manually confirmed instead of inventing exact times, hotels, airports, or booking codes.",
                        ].join(" "),
                },
                {
                    role: "user",
                    content: [
                        "Create a polished itinerary from this booking extraction.",
                        "Make it easy for a traveler to follow before, during, and after the trip.",
                        "Use all available booking clues, but do not hallucinate facts that are not present.",
                        `Booking extraction JSON: ${JSON.stringify(extractedData)}`,
                    ].join("\n"),
                },
            ],
        }),
    });

    if (!response.ok) {
        return null;
    }

    const payload = (await response.json()) as OpenAiResponse;
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
        return null;
    }

    const parsed = tryParseJson(content);

    if (!parsed) {
        return null;
    }

    return normalizeItinerary(parsed, extractedData);
};

export const processTravelDocument = async ({
    fileBuffer,
    fileType,
    originalName,
}: {
    fileBuffer: Buffer;
    fileType: string;
    originalName: string;
}): Promise<ProcessedDocument> => {
    let extractedText = "";

    if (fileType === "application/pdf") {
        extractedText = await readPdfText(fileBuffer);
    } else if (fileType === "text/plain") {
        extractedText = fileBuffer.toString("utf-8");
    }

    const visionExtraction = await callOpenAiForImageExtraction(
        fileBuffer,
        fileType,
        originalName
    );

    const extractedData =
        visionExtraction ?? buildHeuristicExtraction(originalName, extractedText);
    const itinerary =
        (await callOpenAiForItinerary(extractedData)) ??
        buildFallbackItinerary(extractedData);

    return {
        extractedText,
        extractedData,
        itinerary,
        shareId: crypto.randomBytes(8).toString("hex"),
    };
};
