import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { newsService } from "../services/newsService";
import { insertContentAutomationSchema } from "@shared/schema";

const router = Router();

// Content Automation Routes

// GET /api/organizations/:id/automation/content - List all content automations
router.get("/organizations/:orgId/automation/content", async (req, res) => {
  try {
    const orgId = req.params.orgId;
    const automations = await storage.getContentAutomations(orgId);
    
    res.json({
      success: true,
      data: automations
    });
  } catch (error) {
    console.error("Error fetching content automations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch content automations"
    });
  }
});

// POST /api/organizations/:id/automation/content/create - Create new content automation
router.post("/organizations/:orgId/automation/content/create", async (req, res) => {
  try {
    const orgId = req.params.orgId;
    
    // Validate input data
    const validationSchema = insertContentAutomationSchema.extend({
      keywordsSecondary: z.array(z.string()).optional(),
      newsSources: z.array(z.string()).optional(),
      blogConfig: z.object({
        articleSize: z.string().optional(),
        includeElements: z.array(z.string()).optional(),
        writingStyle: z.string().optional(),
        defaultCta: z.string().optional(),
      }).optional(),
      instagramConfig: z.object({
        type: z.string().optional(),
        imageStyle: z.string().optional(),
        includeInPost: z.array(z.string()).optional(),
      }).optional(),
      scheduleDays: z.array(z.string()).optional(),
    });

    const validatedData = validationSchema.parse({
      ...req.body,
      organizationId: orgId,
      blogConfig: {
        articleSize: req.body.articleSize,
        includeElements: req.body.includeElements,
        writingStyle: req.body.writingStyle,
        defaultCta: req.body.defaultCta,
      },
      instagramConfig: {
        type: req.body.instagramType,
        imageStyle: req.body.imageStyle,
        includeInPost: req.body.includeInPost,
      },
      scheduleTime: req.body.publishTime,
    });

    const automation = await storage.createContentAutomation(validatedData);
    
    res.json({
      success: true,
      data: automation,
      message: "Content automation created successfully"
    });
  } catch (error) {
    console.error("Error creating content automation:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid input data",
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Failed to create content automation"
    });
  }
});

// GET /api/organizations/:id/automation/content/:automationId - Get specific automation
router.get("/organizations/:orgId/automation/content/:automationId", async (req, res) => {
  try {
    const automationId = req.params.automationId;
    const automation = await storage.getContentAutomation(automationId);
    
    if (!automation) {
      return res.status(404).json({
        success: false,
        error: "Content automation not found"
      });
    }
    
    res.json({
      success: true,
      data: automation
    });
  } catch (error) {
    console.error("Error fetching content automation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch content automation"
    });
  }
});

// PUT /api/organizations/:id/automation/content/:automationId - Update automation
router.put("/organizations/:orgId/automation/content/:automationId", async (req, res) => {
  try {
    const automationId = req.params.automationId;
    
    const automation = await storage.updateContentAutomation(automationId, req.body);
    
    res.json({
      success: true,
      data: automation,
      message: "Content automation updated successfully"
    });
  } catch (error) {
    console.error("Error updating content automation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update content automation"
    });
  }
});

// DELETE /api/organizations/:id/automation/content/:automationId - Delete automation
router.delete("/organizations/:orgId/automation/content/:automationId", async (req, res) => {
  try {
    const automationId = req.params.automationId;
    
    await storage.deleteContentAutomation(automationId);
    
    res.json({
      success: true,
      message: "Content automation deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting content automation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete content automation"
    });
  }
});

// POST /api/news/search - Test news search functionality
router.post("/news/search", async (req, res) => {
  try {
    const { keyword, language, sources, searchPeriod, pageSize } = req.body;
    
    const articles = await newsService.searchNews({
      keyword: keyword || 'tecnologia',
      language,
      sources,
      searchPeriod,
      pageSize: pageSize || 10
    });
    
    res.json({
      success: true,
      data: {
        total: articles.length,
        articles: articles.slice(0, 10) // Limit for preview
      }
    });
  } catch (error) {
    console.error("Error searching news:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search news",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/news/analyze-relevance - Analyze news relevance
router.post("/news/analyze-relevance", async (req, res) => {
  try {
    const { article, primaryKeyword, secondaryKeywords, niche } = req.body;
    
    if (!article || !primaryKeyword || !niche) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: article, primaryKeyword, niche"
      });
    }
    
    const relevanceAnalysis = await newsService.analyzeRelevance(
      article,
      primaryKeyword,
      secondaryKeywords || [],
      niche
    );
    
    res.json({
      success: true,
      data: relevanceAnalysis
    });
  } catch (error) {
    console.error("Error analyzing relevance:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze relevance",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/news/process-with-relevance - Process news with relevance analysis
router.post("/news/process-with-relevance", async (req, res) => {
  try {
    const { 
      keyword, 
      language, 
      sources, 
      searchPeriod, 
      primaryKeyword, 
      secondaryKeywords, 
      niche, 
      minRelevanceScore 
    } = req.body;
    
    if (!primaryKeyword || !niche) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: primaryKeyword, niche"
      });
    }
    
    // First, search for news
    const articles = await newsService.searchNews({
      keyword: keyword || primaryKeyword,
      language,
      sources,
      searchPeriod,
      pageSize: 20
    });
    
    // Then process with relevance analysis
    const processedNews = await newsService.processNewsWithRelevance(
      articles,
      primaryKeyword,
      secondaryKeywords || [],
      niche,
      minRelevanceScore || 50
    );
    
    res.json({
      success: true,
      data: {
        totalFound: articles.length,
        relevantNews: processedNews.length,
        processedNews: processedNews.slice(0, 5) // Limit for preview
      }
    });
  } catch (error) {
    console.error("Error processing news with relevance:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process news with relevance",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/news/trending/:niche - Get trending topics for a niche
router.get("/news/trending/:niche", async (req, res) => {
  try {
    const niche = req.params.niche;
    const language = req.query.language as string || 'pt';
    
    const trendingTopics = await newsService.getTrendingTopics(niche, language);
    
    res.json({
      success: true,
      data: {
        niche,
        language,
        topics: trendingTopics
      }
    });
  } catch (error) {
    console.error("Error getting trending topics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get trending topics",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/news/test - Test news service functionality
router.get("/news/test", async (req, res) => {
  try {
    const keyword = req.query.keyword as string || 'tecnologia';
    
    const testResult = await newsService.testNewsSearch(keyword);
    
    res.json({
      success: true,
      data: testResult
    });
  } catch (error) {
    console.error("Error testing news service:", error);
    res.status(500).json({
      success: false,
      error: "Failed to test news service",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/organizations/:id/automation/content/:automationId/executions - Get executions
router.get("/organizations/:orgId/automation/content/:automationId/executions", async (req, res) => {
  try {
    const automationId = req.params.automationId;
    const executions = await storage.getContentAutomationExecutions(automationId);
    
    res.json({
      success: true,
      data: executions
    });
  } catch (error) {
    console.error("Error fetching executions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch executions"
    });
  }
});

export default router;