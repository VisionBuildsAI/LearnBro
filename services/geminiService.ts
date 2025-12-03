import { GoogleGenAI, Content, Part, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION, getModeInstruction } from "../constants";
import { TeachingMode, ChatMessage } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const sendMessageToLearnBro = async (
  history: ChatMessage[],
  currentMessage: string,
  imageAttachment: string | null,
  mode: TeachingMode,
  onStream: (text: string) => void
) => {
  try {
    // 1. Prepare history for the model
    // We filter out the current pending message if it was optimistically added to UI state
    // and map strictly to the Content format expected by the SDK
    const historyContent: Content[] = history
      .filter(msg => !msg.contentType || msg.contentType === 'text') // Only send text history
      .map((msg) => {
      const parts: Part[] = [{ text: msg.text }];
      return {
        role: msg.role,
        parts: parts,
      };
    });

    // 2. Add the dynamic mode instruction to the prompt
    // We prepend the mode instruction to the user's message so the model adapts instantly.
    const modePrompt = getModeInstruction(mode);
    const finalPrompt = `[SYSTEM NOTE: ${modePrompt}]\n\n${currentMessage}`;

    const parts: Part[] = [{ text: finalPrompt }];

    // 3. Handle Image
    if (imageAttachment) {
      // Remove data url prefix if present (e.g. "data:image/jpeg;base64,")
      const base64Data = imageAttachment.split(",")[1];
      const mimeType = imageAttachment.split(";")[0].split(":")[1] || "image/jpeg";
      
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      });
    }

    // 4. Initialize Chat
    // We use a fresh chat instance with history for each turn to allow dynamic system instruction updates if needed,
    // though here we embed the mode in the message.
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, // Creative but accurate
      },
      history: historyContent
    });

    // 5. Send Message Stream
    const result = await chat.sendMessageStream({
        config: {
            systemInstruction: SYSTEM_INSTRUCTION, // Reinforce system instruction
        },
        message: parts
    });

    let fullText = "";
    
    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onStream(fullText);
      }
    }

    return fullText;

  } catch (error) {
    console.error("Error in Gemini Service:", error);
    throw error;
  }
};

export const generateStudyMaterial = async (
  topic: string,
  type: 'quiz' | 'flashcards' | 'practice'
): Promise<any> => {
    let schema: any;
    let prompt: string;

    if (type === 'quiz') {
      prompt = `Generate a 5-question multiple choice quiz about "${topic}". The options should be an array of 4 strings. The answer should be the exact string of the correct option.`;
      schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            answer: { type: Type.STRING },
          },
          required: ["question", "options", "answer"],
        },
      };
    } else if (type === 'practice') {
        prompt = `Generate 3 practice problems for "${topic}" ranging from easy to hard. Include a hint and a step-by-step solution for each.`;
        schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    problem: { type: Type.STRING, description: "The problem statement" },
                    hint: { type: Type.STRING, description: "A helpful hint without giving away the answer" },
                    solution: { type: Type.STRING, description: "The detailed solution" }
                },
                required: ["problem", "hint", "solution"]
            }
        };
    } else {
      prompt = `Generate 5 study flashcards for "${topic}". Front is the term/concept, Back is the definition/explanation.`;
      schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING },
          },
          required: ["front", "back"],
        },
      };
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.5
            }
        });

        let text = response.text || "[]";
        // Clean up markdown code blocks if the model includes them
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(text);
    } catch (error) {
        console.error("Error generating study material:", error);
        return [];
    }
};

export const generateDiagram = async (topic: string): Promise<{ image: string, text: string } | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: `Create a clean, educational diagram or illustration explaining: ${topic}. Use simple lines and clear colors suitable for a student learning the topic.` }]
            },
            config: {
                imageConfig: {
                    aspectRatio: "4:3"
                }
            }
        });

        let imageBase64 = null;
        let text = "";

        // Iterate parts to find image and text
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                    imageBase64 = part.inlineData.data;
                } else if (part.text) {
                    text += part.text;
                }
            }
        }

        if (imageBase64) {
            return {
                image: `data:image/png;base64,${imageBase64}`,
                text: text || `Here is a visual aid for ${topic}.`
            };
        }
        return null;

    } catch (error) {
        console.error("Error generating diagram:", error);
        return null;
    }
};