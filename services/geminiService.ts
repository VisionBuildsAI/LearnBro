import { GoogleGenAI, Content, Part, Type, FunctionDeclaration, Tool } from "@google/genai";
import { SYSTEM_INSTRUCTION, getModeInstruction } from "../constants";
import { TeachingMode, ChatMessage, NoteCorrectionData } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// --- Tool Definitions ---

const createQuizTool: FunctionDeclaration = {
  name: "create_quiz",
  description: "Generate a multiple choice quiz for the user to test their knowledge on a specific topic.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING, description: "The specific topic for the quiz." }
    },
    required: ["topic"]
  }
};

const createFlashcardsTool: FunctionDeclaration = {
  name: "create_flashcards",
  description: "Create study flashcards for a specific topic.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING, description: "The topic for the flashcards." }
    },
    required: ["topic"]
  }
};

const createPracticeTool: FunctionDeclaration = {
  name: "create_practice_problems",
  description: "Generate practice problems with hints and solutions.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING, description: "The topic for practice problems." }
    },
    required: ["topic"]
  }
};

const createCheatSheetTool: FunctionDeclaration = {
  name: "create_cheat_sheet",
  description: "Generate a high-yield study cheat sheet or summary for a topic.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING, description: "The topic for the cheat sheet." }
    },
    required: ["topic"]
  }
};

const generateDiagramTool: FunctionDeclaration = {
  name: "generate_diagram",
  description: "Generate a visual diagram or illustration to explain a concept.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      concept: { type: Type.STRING, description: "The concept to visualize." }
    },
    required: ["concept"]
  }
};

const appTools: Tool[] = [{
  functionDeclarations: [createQuizTool, createFlashcardsTool, createPracticeTool, createCheatSheetTool, generateDiagramTool]
}];

// --- Main Chat Function ---

export const sendMessageToLearnBro = async (
  history: ChatMessage[],
  currentMessage: string,
  imageAttachment: string | null,
  mode: TeachingMode,
  onStream: (text: string) => void,
  onToolAction?: (type: string, data: any) => void
) => {
  try {
    // 1. Prepare history
    const historyContent: Content[] = history
      .filter(msg => !msg.contentType || msg.contentType === 'text')
      .map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

    // 2. Prepare Prompt & Image
    const modePrompt = getModeInstruction(mode);
    const finalPrompt = `[SYSTEM NOTE: ${modePrompt}]\n\n${currentMessage}`;
    const parts: Part[] = [{ text: finalPrompt }];

    if (imageAttachment) {
      const base64Data = imageAttachment.split(",")[1];
      const mimeType = imageAttachment.split(";")[0].split(":")[1] || "image/jpeg";
      parts.push({
        inlineData: { mimeType, data: base64Data },
      });
    }

    // 3. Initialize Chat
    const isThinkingMode = mode === TeachingMode.DEEP_THINK;
    const modelName = isThinkingMode ? "gemini-3-pro-preview" : "gemini-2.5-flash";

    const chat = ai.chats.create({
      model: modelName,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: appTools,
        ...(isThinkingMode 
            ? { thinkingConfig: { thinkingBudget: 32768 } } 
            : { temperature: 0.7 }
        ),
      },
      history: historyContent
    });

    // 4. Send Message & Handle Stream
    const result = await chat.sendMessageStream({
        message: parts
    });

    let fullText = "";
    
    for await (const chunk of result) {
      // A. Handle Text
      if (chunk.text) {
        fullText += chunk.text;
        onStream(fullText);
      }

      // B. Handle Function Calls (Tools)
      const functionCalls = chunk.functionCalls; 
      if (functionCalls && functionCalls.length > 0) {
         for (const call of functionCalls) {
             console.log("Tool Triggered:", call.name, call.args);
             
             if (call.name === "create_quiz" && onToolAction) {
                const topic = (call.args as any).topic;
                const data = await generateStudyMaterial(topic, 'quiz');
                onToolAction('quiz', data);
             } else if (call.name === "create_flashcards" && onToolAction) {
                const topic = (call.args as any).topic;
                const data = await generateStudyMaterial(topic, 'flashcards');
                onToolAction('flashcards', data);
             } else if (call.name === "create_practice_problems" && onToolAction) {
                const topic = (call.args as any).topic;
                const data = await generateStudyMaterial(topic, 'practice');
                onToolAction('practice', data);
             } else if (call.name === "create_cheat_sheet" && onToolAction) {
                const topic = (call.args as any).topic;
                const data = await generateStudyMaterial(topic, 'cheatsheet');
                onToolAction('cheatsheet', data);
             } else if (call.name === "generate_diagram" && onToolAction) {
                const concept = (call.args as any).concept;
                const data = await generateDiagram(concept);
                if (data) onToolAction('image', data.image);
             }
         }
      }
    }

    return fullText;

  } catch (error) {
    console.error("Error in Gemini Service:", error);
    throw error;
  }
};

// --- Helper Functions (Executors) ---

export const generateStudyMaterial = async (
  topic: string,
  type: 'quiz' | 'flashcards' | 'practice' | 'cheatsheet'
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
    } else if (type === 'cheatsheet') {
        prompt = `Generate a high-yield cheat sheet for "${topic}". Include a summary, key terms, important formulas or dates, and common pitfalls.`;
        schema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                sections: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "Section title (e.g. 'Key Formulas')" },
                            items: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING },
                                description: "List of key points or formulas"
                            }
                        },
                        required: ["title", "items"]
                    }
                }
            },
            required: ["title", "summary", "sections"]
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
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Error generating study material:", error);
        return type === 'cheatsheet' ? {} : [];
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

export const gradeAndFixNotes = async (text: string, imageBase64: string | null): Promise<NoteCorrectionData | null> => {
  try {
    const parts: Part[] = [];
    
    if (imageBase64) {
      const data = imageBase64.split(",")[1];
      const mimeType = imageBase64.split(";")[0].split(":")[1] || "image/jpeg";
      parts.push({
        inlineData: { mimeType, data }
      });
    }

    parts.push({
      text: `
        Analyze these notes (provided as text, image, or both) acting as a strict but helpful professor.
        1. Identify any factual errors, misconceptions, or missing critical information.
        2. Create a list of these errors with corrections.
        3. Rewrite the complete notes in a highly structured, correct format (Markdown).
        4. Suggest a visual diagram that would clarify the main concept.
        
        ${text ? `Here is the text content of the notes: "${text}"` : ""}
      `
    });

    const schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A title for the notes" },
        analysis: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              point: { type: Type.STRING, description: "The original incorrect or weak point" },
              correction: { type: Type.STRING, description: "The correction or improvement" }
            }
          }
        },
        correctedNotes: { type: Type.STRING, description: "The full corrected notes in Markdown format" },
        diagramPrompt: { type: Type.STRING, description: "A detailed description of a diagram to visualize the concept" }
      },
      required: ["title", "analysis", "correctedNotes", "diagramPrompt"]
    };

    const textResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.3
      }
    });

    const jsonText = textResponse.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}";
    const result = JSON.parse(jsonText);

    let diagramUrl = undefined;
    if (result.diagramPrompt) {
       const diagramRes = await generateDiagram(result.diagramPrompt);
       if (diagramRes?.image) {
         diagramUrl = diagramRes.image;
       }
    }

    return {
      title: result.title,
      analysis: result.analysis,
      correctedNotes: result.correctedNotes,
      diagramUrl: diagramUrl
    };

  } catch (error) {
    console.error("Error grading notes:", error);
    return null;
  }
};