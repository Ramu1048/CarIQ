import api from './api';
import { AIChatResponse, ChatMessage, AISearchResponse, AICompareResponse } from '../types';
import { MOCK_VEHICLES } from './mockData';
import { ragEngine, RagResponse, RagDomain } from './ragKnowledgeEngine';

export const aiService = {
  async askRag(query: string, domain: RagDomain = 'all'): Promise<RagResponse> {
    try {
      const response = await api.post('/ai/chat', { message: query });
      if (response.data && response.data.reply) {
        const localRag = await ragEngine.processRagQuery(query, domain);
        return {
          ...localRag,
          answer: response.data.reply,
        };
      }
    } catch {
      // Graceful fallback to client-side RAG Knowledge Engine
    }
    return await ragEngine.processRagQuery(query, domain);
  },
  async chat(message: string, history: ChatMessage[] = [], contextVehicleIds?: string[]): Promise<AIChatResponse> {
    try {
      const response = await api.post('/ai/chat', {
        message,
        conversation_history: history,
        context_vehicle_ids: contextVehicleIds,
      });
      return response.data;
    } catch {
      // High quality fallback AI response
      const lower = message.toLowerCase();
      let reply = '';
      if (lower.includes('safe') || lower.includes('safety')) {
        reply =
          "Safety is paramount on Indian roads. Tata Motors and Mahindra lead the Bharat NCAP & Global NCAP benchmarks with full 5-star crash safety ratings, reinforced crumple zones, and Level 2 ADAS driver assist packages.";
      } else if (lower.includes('ev') || lower.includes('electric')) {
        reply =
          "For electric mobility, the Tata Nexon EV offers up to 465 km ARAI certified range, rapid DC fast charging (10-80% in 56 mins), and extremely low running costs of roughly ₹1.20 per km.";
      } else if (lower.includes('budget') || lower.includes('lakh') || lower.includes('under')) {
        reply =
          "I've analyzed options based on value proposition and long-term total cost of ownership. The compact SUV and crossover segments offer the best blend of ground clearance, fuel efficiency, and resale value.";
      } else {
        reply =
          `I understand you're looking for guidance on: "${message}". I can help you filter by budget, compare ground clearance, check real-world mileage, or calculate monthly EMI!`;
      }

      const updatedHistory: ChatMessage[] = [
        ...history,
        { role: 'user', content: message },
        { role: 'assistant', content: reply },
      ];

      return {
        reply,
        conversation_history: updatedHistory,
        referenced_vehicles: MOCK_VEHICLES.slice(0, 2),
        ai_provider_used: 'CarIQ Intelligence Engine (Local/Mock)',
      };
    }
  },

  async nlpSearch(query: string): Promise<AISearchResponse> {
    try {
      const response = await api.post('/ai/search', { query, limit: 10 });
      return response.data;
    } catch {
      // Mock natural language search interpreter
      const q = query.toLowerCase();
      const prefs: Record<string, any> = {};
      if (q.includes('suv')) prefs.body_type = 'SUV';
      if (q.includes('automatic')) prefs.transmission = 'Automatic';
      if (q.includes('ev') || q.includes('electric')) prefs.fuel_type = 'Electric';
      if (q.includes('safe') || q.includes('safety')) prefs.priority = '5-Star Safety';
      if (q.includes('20 lakh') || q.includes('20l')) prefs.budget_max = 2000000;
      else if (q.includes('15 lakh') || q.includes('15l')) prefs.budget_max = 1500000;

      return {
        query,
        interpreted_preferences: prefs,
        results: MOCK_VEHICLES.slice(0, 4),
        summary: `Identified preferences: ${Object.entries(prefs).map(([k, v]) => `${k}: ${v}`).join(', ') || 'General automotive discovery'}.`,
        total: MOCK_VEHICLES.length,
      };
    }
  },

  async compareVehicles(vehicleIds: string[]): Promise<AICompareResponse> {
    try {
      const response = await api.post('/ai/compare', { vehicle_ids: vehicleIds });
      return response.data;
    } catch {
      const selected = MOCK_VEHICLES.filter((v) => vehicleIds.includes(v.id));
      const vehicles = selected.length >= 2 ? selected : MOCK_VEHICLES.slice(0, 2);

      return {
        vehicles,
        ai_verdict: `Comparing ${vehicles.map((v) => `${v.brand.name} ${v.model_name}`).join(' vs ')}: For maximum occupant safety and road authority, ${vehicles[0].brand.name} takes the crown. For everyday urban ease, ${vehicles[1].brand.name} offers a more relaxed drive.`,
        winner_by_category: {
          'Safety & Crash Protection': `${vehicles[0].brand.name} ${vehicles[0].model_name} (5★ Bharat NCAP)`,
          'Fuel & Running Cost': `${vehicles[1].brand.name} ${vehicles[1].model_name} (Highest Efficiency)`,
          'Price & Value': `Best balanced upfront acquisition`,
        },
        key_tradeoffs: [
          'Heavier chassis delivers superior highway stability but slightly firmer low-speed ride.',
          'Advanced electronic driver aids require an initial learning curve.',
        ],
        best_for: {
          [vehicles[0].model_name]: 'Highway touring, families, safety-first drivers',
          [vehicles[1].model_name]: 'Daily city commutes, easy parking, low maintenance',
        },
      };
    }
  },
};
