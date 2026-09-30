import { Router } from 'express';

const router = Router();

const VENDING_TOOL_SPEC = {
  name: "dispense_product",
  description: "Dispense a product from the vending machine given product name or ID",
  parameters: {
    productName: "string (e.g. 'Cola Zero', 'Protein Bar', 'Sparkling Water', 'Salted Chips', 'Matcha Latte', 'Energy Boost', 'Mixed Nuts', 'Gummy Bears')",
    quantity: "number (default 1)"
  }
};

router.post('/agent', async (req, res) => {
  const { prompt, inventory } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Invalid request: "prompt" string is required.' });
  }

  const inventoryList = Array.isArray(inventory) ? inventory : [];
  
  const inventoryContext = inventoryList.map(p => 
    `- ${p.name} (ID: ${p.id}): Price $${p.price.toFixed(2)}, Stock ${p.stock}/${p.maxStock}, Category: ${p.category}`
  ).join('\n');

  const systemMessage = `You are SmartVend AI, an intelligent vending machine assistant equipped with tools.

AVAILABLE INVENTORY:
${inventoryContext || 'No inventory loaded.'}

AVAILABLE TOOL:
Tool Name: ${VENDING_TOOL_SPEC.name}
Description: ${VENDING_TOOL_SPEC.description}
Parameters: ${JSON.stringify(VENDING_TOOL_SPEC.parameters)}

INSTRUCTIONS:
1. If the user wants to buy, get, order, or dispense a product (e.g. "Give me a Cola Zero", "I want a protein bar", "Dispense sparkling water", "Buy chips"), call the tool "${VENDING_TOOL_SPEC.name}".
2. ALWAYS output a single valid JSON object in the following format:
{
  "thought": "Your internal reasoning process",
  "tool_call": {
    "name": "dispense_product",
    "parameters": {
      "productName": "Exact or best matching product name from inventory"
    }
  },
  "response": "User-facing message explaining what action is being taken"
}
3. If the user is just asking a question (e.g. "What drinks do you have?", "How much is protein bar?"), set "tool_call": null and answer politely in "response".
4. DO NOT wrap JSON in markdown code fences. Respond ONLY with the JSON object.`;

  const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'gemma:2b';

  const messages = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: prompt }
  ];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        messages: messages,
        stream: false,
        format: 'json'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Ollama error (${response.status}): ${errText}` });
    }

    const data = await response.json();
    const rawContent = data.message?.content || '';

    let parsedAgentOutput = null;
    try {
      const jsonStr = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedAgentOutput = JSON.parse(jsonStr);
    } catch (_) {
      parsedAgentOutput = {
        thought: "Raw model text response",
        tool_call: null,
        response: rawContent || "I'm SmartVend AI. How can I assist you with the vending machine today?"
      };
    }

    const lowercasePrompt = prompt.toLowerCase();
    const isDispenseIntent = /dispense|give|get|want|buy|order|need|have/i.test(lowercasePrompt);

    // If model failed to emit tool_call but prompt clearly indicates dispense intent:
    if (!parsedAgentOutput.tool_call && isDispenseIntent) {
      const matchedProduct = inventoryList.find(p => lowercasePrompt.includes(p.name.toLowerCase())) ||
        (lowercasePrompt.includes('cola') || lowercasePrompt.includes('coke') ? inventoryList.find(p => p.id === 'p1') : null) ||
        (lowercasePrompt.includes('water') ? inventoryList.find(p => p.id === 'p2') : null) ||
        (lowercasePrompt.includes('energy') || lowercasePrompt.includes('boost') ? inventoryList.find(p => p.id === 'p3') : null) ||
        (lowercasePrompt.includes('protein') || lowercasePrompt.includes('bar') ? inventoryList.find(p => p.id === 'p4') : null) ||
        (lowercasePrompt.includes('chip') || lowercasePrompt.includes('chips') ? inventoryList.find(p => p.id === 'p5') : null) ||
        (lowercasePrompt.includes('nut') || lowercasePrompt.includes('nuts') ? inventoryList.find(p => p.id === 'p6') : null) ||
        (lowercasePrompt.includes('matcha') || lowercasePrompt.includes('latte') ? inventoryList.find(p => p.id === 'p7') : null) ||
        (lowercasePrompt.includes('gummy') || lowercasePrompt.includes('bear') ? inventoryList.find(p => p.id === 'p8') : null);

      if (matchedProduct) {
        parsedAgentOutput.tool_call = {
          name: "dispense_product",
          parameters: { productName: matchedProduct.name }
        };
        parsedAgentOutput.thought = `Detected dispense intent for product "${matchedProduct.name}" from prompt "${prompt}"`;
      } else {
        // Extract product candidate name from prompt
        const words = prompt.replace(/dispense|give me|i want|get me|buy|order/gi, '').trim();
        if (words) {
          parsedAgentOutput.tool_call = {
            name: "dispense_product",
            parameters: { productName: words }
          };
        }
      }
    }

    // VALIDATION & TOOL EXECUTION PARSING
    let toolExecution = null;

    if (parsedAgentOutput.tool_call && parsedAgentOutput.tool_call.name === 'dispense_product') {
      const targetName = (parsedAgentOutput.tool_call.parameters?.productName || '').toLowerCase().trim();
      
      const foundProduct = inventoryList.find(p => 
        p.name.toLowerCase() === targetName ||
        p.name.toLowerCase().includes(targetName) ||
        targetName.includes(p.name.toLowerCase()) ||
        p.id.toLowerCase() === targetName
      );

      if (!foundProduct) {
        toolExecution = {
          tool: 'dispense_product',
          requestedName: parsedAgentOutput.tool_call.parameters?.productName,
          status: 'ERROR',
          code: 'PRODUCT_NOT_FOUND',
          valid: false,
          message: `Product "${parsedAgentOutput.tool_call.parameters?.productName}" was not found in machine inventory.`
        };
        parsedAgentOutput.response = `Sorry, I couldn't find "${parsedAgentOutput.tool_call.parameters?.productName}" in our inventory. Available items: ${inventoryList.map(i => i.name).join(', ')}.`;
      } else if (foundProduct.stock <= 0) {
        toolExecution = {
          tool: 'dispense_product',
          requestedName: parsedAgentOutput.tool_call.parameters?.productName,
          product: foundProduct,
          status: 'ERROR',
          code: 'OUT_OF_STOCK',
          valid: false,
          message: `Product "${foundProduct.name}" is out of stock (Stock: 0).`
        };
        parsedAgentOutput.response = `Sorry! ${foundProduct.emoji || ''} ${foundProduct.name} is currently OUT OF STOCK. Please choose another item.`;
      } else {
        toolExecution = {
          tool: 'dispense_product',
          requestedName: parsedAgentOutput.tool_call.parameters?.productName,
          product: foundProduct,
          status: 'SUCCESS',
          code: 'VALIDATED',
          valid: true,
          message: `Validated dispense for ${foundProduct.name} ($${foundProduct.price.toFixed(2)})`
        };
        parsedAgentOutput.response = `[TOOL EXECUTION SUCCESS] Dispensing ${foundProduct.emoji || '📦'} ${foundProduct.name} ($${foundProduct.price.toFixed(2)})...`;
      }
    }

    return res.json({
      status: 'success',
      agent: parsedAgentOutput,
      toolExecution: toolExecution,
      model: data.model || ollamaModel
    });

  } catch (error) {
    console.error('Vending Agent Error:', error);
    return res.status(500).json({
      error: 'Failed to process vending agent request: ' + error.message
    });
  }
});

export default router;
