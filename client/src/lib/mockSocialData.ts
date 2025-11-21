/**
 * Mock Data para Redes Sociais
 * Simula dados realistas de todas as plataformas integradas
 */

export type Platform = 'instagram' | 'facebook' | 'youtube' | 'twitter' | 'linkedin' | 'tiktok' | 'google';

// =============================================================================
// REDES SOCIAIS CONECTADAS (Mock)
// =============================================================================

export const mockConnectedNetworks = [
  {
    id: 'net_instagram_001',
    platform: 'instagram' as Platform,
    isConnected: true,
    accountName: '@automationglobal',
    accountId: 'ig_17841405309211844',
    followers: 45237,
    profileImage: 'https://i.pravatar.cc/150?img=1'
  },
  {
    id: 'net_facebook_001',
    platform: 'facebook' as Platform,
    isConnected: true,
    accountName: 'Automation Global Marketing',
    accountId: 'fb_102345678901234',
    followers: 89456,
    profileImage: 'https://i.pravatar.cc/150?img=2'
  },
  {
    id: 'net_youtube_001',
    platform: 'youtube' as Platform,
    isConnected: true,
    accountName: 'Automation Global Channel',
    accountId: 'yt_UCx1234567890',
    followers: 127834,
    profileImage: 'https://i.pravatar.cc/150?img=3'
  },
  {
    id: 'net_twitter_001',
    platform: 'twitter' as Platform,
    isConnected: true,
    accountName: '@AutoGlobalHQ',
    accountId: 'tw_1234567890',
    followers: 34521,
    profileImage: 'https://i.pravatar.cc/150?img=4'
  },
  {
    id: 'net_linkedin_001',
    platform: 'linkedin' as Platform,
    isConnected: true,
    accountName: 'Automation Global Inc.',
    accountId: 'li_987654321',
    followers: 12847,
    profileImage: 'https://i.pravatar.cc/150?img=5'
  },
  {
    id: 'net_tiktok_001',
    platform: 'tiktok' as Platform,
    isConnected: true,
    accountName: '@automationglobal',
    accountId: 'tt_6789012345',
    followers: 234567,
    profileImage: 'https://i.pravatar.cc/150?img=6'
  },
  {
    id: 'net_google_001',
    platform: 'google' as Platform,
    isConnected: true,
    accountName: 'Automation Global Ads',
    accountId: 'ga_1234-5678-9012',
    followers: 0, // Google Ads não tem followers
    profileImage: 'https://i.pravatar.cc/150?img=7'
  }
];

// =============================================================================
// MÉTRICAS POR REDE SOCIAL
// =============================================================================

export const mockMetrics = {
  instagram: {
    impressions: 1245800,
    impressionsChange: 15.3,
    reach: 987654,
    reachChange: 12.8,
    engagement: 87234,
    engagementChange: 8.5,
    engagementRate: 7.02,
    engagementRateChange: -0.3,
    followers: 45237,
    followersChange: 234,
    following: 1247,
    posts: 342,
    storiesViews: 123456,
    storiesViewsChange: 18.4,
    reelsPlays: 456789,
    reelsPlaysChange: 25.7,
    profileVisits: 34521,
    profileVisitsChange: 9.2,
    websiteClicks: 8934,
    websiteClicksChange: 14.6,
    topPosts: [
      { id: '1', caption: 'Lançamento do novo produto 🚀', likes: 4523, comments: 287, shares: 145, reach: 45678 },
      { id: '2', caption: 'Bastidores do escritório 📸', likes: 3876, comments: 198, shares: 92, reach: 38942 },
      { id: '3', caption: 'Dica rápida de marketing', likes: 3245, comments: 156, shares: 78, reach: 32156 }
    ]
  },

  facebook: {
    impressions: 2145600,
    impressionsChange: 18.7,
    reach: 1876543,
    reachChange: 16.4,
    engagement: 145678,
    engagementChange: 11.2,
    engagementRate: 7.77,
    engagementRateChange: -1.2,
    pageViews: 56789,
    pageViewsChange: 13.5,
    pageLikes: 89456,
    pageLikesChange: 512,
    followers: 89456,
    followersChange: 512,
    postReach: 1234567,
    postReachChange: 14.8,
    reactions: 78934,
    reactionsChange: 9.7,
    comments: 12456,
    commentsChange: 7.3,
    shares: 8765,
    sharesChange: 15.2,
    videoViews: 456789,
    videoViewsChange: 22.4,
    clicksToWebsite: 23456,
    clicksToWebsiteChange: 18.9
  },

  youtube: {
    impressions: 3456789,
    impressionsChange: 21.5,
    views: 2345678,
    viewsChange: 19.8,
    watchTime: 456789, // em minutos
    watchTimeChange: 17.3,
    averageViewDuration: 8.5, // em minutos
    averageViewDurationChange: 2.1,
    subscribers: 127834,
    subscribersChange: 1234,
    likes: 234567,
    likesChange: 15.6,
    comments: 23456,
    commentsChange: 12.3,
    shares: 12345,
    sharesChange: 9.8,
    ctr: 8.9, // Click-through rate
    ctrChange: 1.2,
    topVideos: [
      { id: '1', title: 'Como automatizar seu marketing', views: 345678, likes: 23456, comments: 1234, duration: 12.5 },
      { id: '2', title: '10 dicas de growth hacking', views: 287654, likes: 19876, comments: 987, duration: 15.2 },
      { id: '3', title: 'Tutorial completo de automação', views: 234567, likes: 17654, comments: 765, duration: 25.3 }
    ]
  },

  twitter: {
    impressions: 987654,
    impressionsChange: 14.2,
    engagement: 67890,
    engagementChange: 11.7,
    engagementRate: 6.88,
    engagementRateChange: -0.5,
    followers: 34521,
    followersChange: 187,
    following: 987,
    tweets: 2345,
    retweets: 12345,
    retweetsChange: 16.3,
    likes: 45678,
    likesChange: 13.9,
    replies: 8765,
    repliesChange: 9.2,
    mentions: 4567,
    mentionsChange: 18.7,
    profileVisits: 23456,
    profileVisitsChange: 12.4,
    linkClicks: 9876,
    linkClicksChange: 15.8,
    topTweets: [
      { id: '1', text: 'Acabamos de lançar nossa nova feature! 🎉', likes: 1234, retweets: 567, replies: 89 },
      { id: '2', text: 'Thread sobre marketing digital em 2024', likes: 987, retweets: 432, replies: 65 },
      { id: '3', text: 'Dica rápida: Como aumentar seu engagement', likes: 876, retweets: 321, replies: 54 }
    ]
  },

  linkedin: {
    impressions: 567890,
    impressionsChange: 16.8,
    reach: 456789,
    reachChange: 14.5,
    engagement: 34567,
    engagementChange: 10.3,
    engagementRate: 7.56,
    engagementRateChange: -0.8,
    followers: 12847,
    followersChange: 156,
    connections: 8934,
    connectionsChange: 87,
    posts: 234,
    profileViews: 23456,
    profileViewsChange: 15.7,
    searchAppearances: 12345,
    searchAppearancesChange: 11.2,
    reactions: 12345,
    reactionsChange: 13.4,
    comments: 2345,
    commentsChange: 9.8,
    shares: 1234,
    sharesChange: 12.7,
    clicksToWebsite: 5678,
    clicksToWebsiteChange: 17.9,
    topPosts: [
      { id: '1', text: 'Insights sobre transformação digital', likes: 456, comments: 67, shares: 89 },
      { id: '2', text: 'Case de sucesso: Como aumentamos ROI em 300%', likes: 389, comments: 54, shares: 76 },
      { id: '3', text: 'Tendências de marketing B2B para 2024', likes: 312, comments: 45, shares: 62 }
    ]
  },

  tiktok: {
    impressions: 4567890,
    impressionsChange: 28.5,
    videoViews: 3456789,
    videoViewsChange: 32.7,
    likes: 456789,
    likesChange: 25.3,
    comments: 34567,
    commentsChange: 19.8,
    shares: 23456,
    sharesChange: 27.4,
    followers: 234567,
    followersChange: 3456,
    following: 456,
    profileViews: 123456,
    profileViewsChange: 21.6,
    averageWatchTime: 45, // em segundos
    averageWatchTimeChange: 8.3,
    completionRate: 67.8, // %
    completionRateChange: 4.2,
    engagement: 514812,
    engagementChange: 24.9,
    engagementRate: 14.88,
    engagementRateChange: 2.1,
    topVideos: [
      { id: '1', caption: 'Tutorial rápido de automação 🚀', views: 567890, likes: 78901, comments: 4567, shares: 3456 },
      { id: '2', caption: 'Bastidores da criação de conteúdo', views: 456789, likes: 67890, comments: 3456, shares: 2345 },
      { id: '3', caption: 'Dica de marketing em 30 segundos', views: 389012, likes: 56789, comments: 2890, shares: 1987 }
    ],
    trendingHashtags: ['#marketingdigital', '#automacao', '#growthacking', '#contentcreator', '#businesstips']
  },

  google: {
    impressions: 1876543,
    impressionsChange: 17.9,
    clicks: 123456,
    clicksChange: 15.4,
    ctr: 6.58, // Click-through rate
    ctrChange: -0.3,
    conversions: 8934,
    conversionsChange: 19.7,
    conversionRate: 7.24,
    conversionRateChange: 1.8,
    cost: 45678, // em reais
    costChange: -5.3,
    cpc: 0.37, // Custo por clique
    cpcChange: -12.4,
    costPerConversion: 5.11,
    costPerConversionChange: -18.6,
    roi: 487, // %
    roiChange: 23.5,
    qualityScore: 8.5, // de 10
    qualityScoreChange: 0.5,
    topCampaigns: [
      { id: '1', name: 'Campanha Produto Novo', impressions: 456789, clicks: 34567, conversions: 2345, cost: 12345 },
      { id: '2', name: 'Remarketing - Carrinhos Abandonados', impressions: 345678, clicks: 28901, conversions: 1987, cost: 9876 },
      { id: '3', name: 'Brand Awareness 2024', impressions: 567890, clicks: 23456, conversions: 1654, cost: 8765 }
    ]
  }
};

// =============================================================================
// FOLLOWERS / UNFOLLOWERS POR REDE
// =============================================================================

export const mockFollowersData = {
  instagram: {
    currentFollowers: 45237,
    newFollowers: 847,
    unfollowers: 123,
    netGrowth: 724,
    growthRate: 1.63,
    topFollowers: [
      { id: '1', username: '@maria_silva', avatar: 'https://i.pravatar.cc/50?img=10', engagement: 'high' },
      { id: '2', username: '@joao_santos', avatar: 'https://i.pravatar.cc/50?img=11', engagement: 'medium' },
      { id: '3', username: '@ana_rodrigues', avatar: 'https://i.pravatar.cc/50?img=12', engagement: 'high' }
    ],
    recentUnfollowers: [
      { id: '1', username: '@pedro_costa', avatar: 'https://i.pravatar.cc/50?img=13', unfollowedAt: '2024-01-15' },
      { id: '2', username: '@carla_oliveira', avatar: 'https://i.pravatar.cc/50?img=14', unfollowedAt: '2024-01-14' }
    ]
  },

  facebook: {
    currentFollowers: 89456,
    newFollowers: 1567,
    unfollowers: 245,
    netGrowth: 1322,
    growthRate: 1.50,
    demographics: {
      age: { '18-24': 23, '25-34': 42, '35-44': 21, '45-54': 10, '55+': 4 },
      gender: { male: 52, female: 46, other: 2 },
      topCities: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Porto Alegre']
    }
  },

  youtube: {
    currentSubscribers: 127834,
    newSubscribers: 2847,
    unsubscribers: 387,
    netGrowth: 2460,
    growthRate: 1.96,
    watchTimeGrowth: 12456, // minutos
    viewsFromSubscribers: 65.4 // %
  },

  twitter: {
    currentFollowers: 34521,
    newFollowers: 456,
    unfollowers: 89,
    netGrowth: 367,
    growthRate: 1.08,
    topInfluencers: [
      { id: '1', username: '@tech_guru_br', followers: 145000, engagement: 'high' },
      { id: '2', username: '@marketing_pro', followers: 98000, engagement: 'medium' }
    ]
  },

  linkedin: {
    currentFollowers: 12847,
    newFollowers: 289,
    unfollowers: 34,
    netGrowth: 255,
    growthRate: 2.03,
    newConnections: 187,
    connectionRequests: 245,
    professionalDemographics: {
      jobTitles: ['Marketing Manager', 'CEO', 'Digital Marketing Specialist', 'Growth Hacker', 'Business Owner'],
      industries: ['Technology', 'Marketing & Advertising', 'E-commerce', 'Consulting', 'SaaS']
    }
  },

  tiktok: {
    currentFollowers: 234567,
    newFollowers: 7890,
    unfollowers: 456,
    netGrowth: 7434,
    growthRate: 3.27,
    viralPotential: 8.7, // de 10
    audienceAge: { '13-17': 18, '18-24': 52, '25-34': 23, '35-44': 5, '45+': 2 }
  },

  google: {
    // Google Ads não tem followers tradicionais
    audienceSize: 1234567,
    audienceSizeChange: 15.7,
    remarketingList: 234567,
    remarketingListChange: 12.3
  }
};

// =============================================================================
// CONFIGURAÇÃO DE STAGES DO FUNIL POR REDE SOCIAL
// =============================================================================

export const funnelStagesByPlatform = {
  instagram: [
    { name: 'Descoberta', description: 'Impressões e Alcance', color: { from: '#FFB300', to: '#FFA000' } },
    { name: 'Interesse', description: 'Visualizações de Perfil', color: { from: '#26C6DA', to: '#00ACC1' } },
    { name: 'Engajamento', description: 'Curtidas/Comentários/Saves', color: { from: '#42A5F5', to: '#1E88E5' } },
    { name: 'Clique', description: 'Link na Bio/Stories', color: { from: '#FF7043', to: '#F4511E' } },
    { name: 'Conversão', description: 'DM/Compra/Cadastro', color: { from: '#EC407A', to: '#D81B60' } }
  ],

  facebook: [
    { name: 'Impressões', description: 'Alcance de Posts/Ads', color: { from: '#FFB300', to: '#FFA000' } },
    { name: 'Engajamento', description: 'Reações/Comentários/Shares', color: { from: '#26C6DA', to: '#00ACC1' } },
    { name: 'Cliques', description: 'Link/CTA', color: { from: '#42A5F5', to: '#1E88E5' } },
    { name: 'Landing Page', description: 'Visitas ao site', color: { from: '#FF7043', to: '#F4511E' } },
    { name: 'Conversão', description: 'Lead/Compra', color: { from: '#EC407A', to: '#D81B60' } }
  ],

  youtube: [
    { name: 'Impressões', description: 'Thumbnails mostrados', color: { from: '#FFB300', to: '#FFA000' } },
    { name: 'Cliques', description: 'CTR - Click Through Rate', color: { from: '#26C6DA', to: '#00ACC1' } },
    { name: 'Visualizações', description: 'Tempo de watch', color: { from: '#42A5F5', to: '#1E88E5' } },
    { name: 'Engajamento', description: 'Likes/Inscrições/Comentários', color: { from: '#FF7043', to: '#F4511E' } },
    { name: 'Conversão', description: 'Link descrição/Cards', color: { from: '#EC407A', to: '#D81B60' } }
  ],

  twitter: [
    { name: 'Impressões', description: 'Tweets na timeline', color: { from: '#FFB300', to: '#FFA000' } },
    { name: 'Engajamento', description: 'Likes/RTs/Replies', color: { from: '#26C6DA', to: '#00ACC1' } },
    { name: 'Cliques', description: 'Link externo', color: { from: '#42A5F5', to: '#1E88E5' } },
    { name: 'Perfil', description: 'Visitas ao Perfil', color: { from: '#FF7043', to: '#F4511E' } },
    { name: 'Conversão', description: 'Follow/Site/Ação', color: { from: '#EC407A', to: '#D81B60' } }
  ],

  linkedin: [
    { name: 'Impressões', description: 'Posts na feed', color: { from: '#FFB300', to: '#FFA000' } },
    { name: 'Engajamento', description: 'Reações/Comentários', color: { from: '#26C6DA', to: '#00ACC1' } },
    { name: 'Cliques', description: 'CTR para artigo/site', color: { from: '#42A5F5', to: '#1E88E5' } },
    { name: 'Leads', description: 'InMail/Form', color: { from: '#FF7043', to: '#F4511E' } },
    { name: 'Conversão', description: 'B2B/Contrato/Demo', color: { from: '#EC407A', to: '#D81B60' } }
  ],

  tiktok: [
    { name: 'Visualizações', description: 'FYP - For You Page', color: { from: '#FFB300', to: '#FFA000' } },
    { name: 'Watch Time', description: 'Completion Rate', color: { from: '#26C6DA', to: '#00ACC1' } },
    { name: 'Engajamento', description: 'Likes/Shares/Comments', color: { from: '#42A5F5', to: '#1E88E5' } },
    { name: 'Perfil', description: 'Visitas ao Perfil', color: { from: '#FF7043', to: '#F4511E' } },
    { name: 'Conversão', description: 'Bio Link/Loja/Follow', color: { from: '#EC407A', to: '#D81B60' } }
  ],

  google: [
    { name: 'Impressões', description: 'Anúncios mostrados', color: { from: '#FFB300', to: '#FFA000' } },
    { name: 'Cliques', description: 'CTR', color: { from: '#26C6DA', to: '#00ACC1' } },
    { name: 'Landing Page', description: 'Bounce rate', color: { from: '#42A5F5', to: '#1E88E5' } },
    { name: 'Micro-conversão', description: 'Formulário/Carrinho', color: { from: '#FF7043', to: '#F4511E' } },
    { name: 'Conversão', description: 'Compra/Lead qualificado', color: { from: '#EC407A', to: '#D81B60' } }
  ]
};

// =============================================================================
// FUNIL DE CONVERSÃO POR REDE
// =============================================================================

export const mockConversionFunnel = {
  instagram: {
    awareness: { count: 1245800, percentage: 100, dropOff: 0 },
    interest: { count: 987654, percentage: 79.3, dropOff: 20.7 },
    consideration: { count: 456789, percentage: 36.7, dropOff: 42.6 },
    conversion: { count: 87234, percentage: 7.0, dropOff: 80.9 },
    retention: { count: 45678, percentage: 3.7, dropOff: 47.6 }
  },

  facebook: {
    awareness: { count: 2145600, percentage: 100, dropOff: 0 },
    interest: { count: 1718480, percentage: 80.1, dropOff: 19.9 },
    consideration: { count: 858240, percentage: 40.0, dropOff: 50.1 },
    conversion: { count: 145678, percentage: 6.8, dropOff: 83.0 },
    retention: { count: 87407, percentage: 4.1, dropOff: 40.0 }
  },

  youtube: {
    awareness: { count: 3456789, percentage: 100, dropOff: 0 },
    interest: { count: 2422952, percentage: 70.1, dropOff: 29.9 },
    consideration: { count: 1037037, percentage: 30.0, dropOff: 57.2 },
    conversion: { count: 234567, percentage: 6.8, dropOff: 77.4 },
    retention: { count: 140740, percentage: 4.1, dropOff: 40.0 }
  },

  twitter: {
    awareness: { count: 987654, percentage: 100, dropOff: 0 },
    interest: { count: 740741, percentage: 75.0, dropOff: 25.0 },
    consideration: { count: 345679, percentage: 35.0, dropOff: 53.3 },
    conversion: { count: 67890, percentage: 6.9, dropOff: 80.4 },
    retention: { count: 37545, percentage: 3.8, dropOff: 44.7 }
  },

  linkedin: {
    awareness: { count: 567890, percentage: 100, dropOff: 0 },
    interest: { count: 454312, percentage: 80.0, dropOff: 20.0 },
    consideration: { count: 227156, percentage: 40.0, dropOff: 50.0 },
    conversion: { count: 34567, percentage: 6.1, dropOff: 84.8 },
    retention: { count: 20740, percentage: 3.7, dropOff: 40.0 }
  },

  tiktok: {
    awareness: { count: 4567890, percentage: 100, dropOff: 0 },
    interest: { count: 3198323, percentage: 70.0, dropOff: 30.0 },
    consideration: { count: 1370367, percentage: 30.0, dropOff: 57.1 },
    conversion: { count: 456789, percentage: 10.0, dropOff: 66.7 },
    retention: { count: 273473, percentage: 6.0, dropOff: 40.1 }
  },

  google: {
    awareness: { count: 1876543, percentage: 100, dropOff: 0 },
    interest: { count: 1313580, percentage: 70.0, dropOff: 30.0 },
    consideration: { count: 750617, percentage: 40.0, dropOff: 42.9 },
    conversion: { count: 123456, percentage: 6.6, dropOff: 83.6 },
    retention: { count: 74073, percentage: 3.9, dropOff: 40.0 }
  }
};

// =============================================================================
// IA INSIGHTS POR REDE SOCIAL
// =============================================================================

export const mockAIInsights = {
  instagram: [
    {
      id: '1',
      title: 'Melhor horário de postagem',
      description: 'Seus seguidores estão mais ativos às 20h. Aumente o alcance postando neste horário.',
      priority: 'high',
      confidence: 94,
      time: '5 min atrás',
      actionable: true,
      impact: 'Alto'
    },
    {
      id: '2',
      title: 'Reels performando 3x melhor',
      description: 'Reels têm 327% mais engagement que posts tradicionais. Foque neste formato.',
      priority: 'high',
      confidence: 91,
      time: '12 min atrás',
      actionable: true,
      impact: 'Muito Alto'
    },
    {
      id: '3',
      title: 'Hashtags de tendência detectadas',
      description: '#marketingdigital2024 cresceu 450% esta semana. Use em seus próximos posts.',
      priority: 'medium',
      confidence: 87,
      time: '1h atrás',
      actionable: true,
      impact: 'Médio'
    }
  ],

  facebook: [
    {
      id: '1',
      title: 'Vídeos curtos gerando mais shares',
      description: 'Vídeos de 30-60s têm 5x mais compartilhamentos. Adapte sua estratégia.',
      priority: 'high',
      confidence: 92,
      time: '8 min atrás',
      actionable: true,
      impact: 'Alto'
    },
    {
      id: '2',
      title: 'Audiência jovem crescendo 28%',
      description: 'Público 18-24 anos aumentou significativamente. Adapte conteúdo para este grupo.',
      priority: 'medium',
      confidence: 89,
      time: '15 min atrás',
      actionable: true,
      impact: 'Médio'
    }
  ],

  youtube: [
    {
      id: '1',
      title: 'Thumbnails com rostos performam melhor',
      description: 'CTR é 45% maior em vídeos com rostos no thumbnail. Atualize seus próximos vídeos.',
      priority: 'high',
      confidence: 96,
      time: '3 min atrás',
      actionable: true,
      impact: 'Muito Alto'
    },
    {
      id: '2',
      title: 'Vídeos longos retendo audiência',
      description: 'Conteúdo 15-20min tem 85% de retenção. Seu público prefere conteúdo aprofundado.',
      priority: 'high',
      confidence: 93,
      time: '10 min atrás',
      actionable: true,
      impact: 'Alto'
    }
  ],

  twitter: [
    {
      id: '1',
      title: 'Threads gerando 4x mais engagement',
      description: 'Threads educativos têm performance superior. Crie mais conteúdo neste formato.',
      priority: 'high',
      confidence: 90,
      time: '6 min atrás',
      actionable: true,
      impact: 'Alto'
    },
    {
      id: '2',
      title: 'Menções de influenciadores aumentando',
      description: '3 influenciadores mencionaram sua marca. Engaje para amplificar alcance.',
      priority: 'medium',
      confidence: 88,
      time: '20 min atrás',
      actionable: true,
      impact: 'Médio'
    }
  ],

  linkedin: [
    {
      id: '1',
      title: 'Posts com dados performam 6x melhor',
      description: 'Conteúdo com estatísticas e números têm muito mais engagement. Use mais dados.',
      priority: 'high',
      confidence: 95,
      time: '4 min atrás',
      actionable: true,
      impact: 'Muito Alto'
    },
    {
      id: '2',
      title: 'Publicações de terça e quinta performam melhor',
      description: 'Engagement é 67% maior nesses dias. Ajuste seu calendário editorial.',
      priority: 'medium',
      confidence: 91,
      time: '18 min atrás',
      actionable: true,
      impact: 'Médio'
    }
  ],

  tiktok: [
    {
      id: '1',
      title: 'Conteúdo de tendência detectado',
      description: 'Sound "Trending Audio 2024" tem potencial viral. Use nos próximos 24h.',
      priority: 'high',
      confidence: 97,
      time: '2 min atrás',
      actionable: true,
      impact: 'Muito Alto'
    },
    {
      id: '2',
      title: 'Horário nobre: 19h-22h',
      description: 'Sua audiência é 8x mais ativa neste período. Agende posts estrategicamente.',
      priority: 'high',
      confidence: 94,
      time: '7 min atrás',
      actionable: true,
      impact: 'Alto'
    },
    {
      id: '3',
      title: 'Vídeos 7-15s têm maior completion rate',
      description: '92% dos usuários assistem até o final. Mantenha vídeos nesta duração.',
      priority: 'medium',
      confidence: 89,
      time: '25 min atrás',
      actionable: true,
      impact: 'Médio'
    }
  ],

  google: [
    {
      id: '1',
      title: 'CPC 15% abaixo da média do setor',
      description: 'Suas campanhas estão muito eficientes. Considere aumentar budget para escalar.',
      priority: 'high',
      confidence: 98,
      time: '1 min atrás',
      actionable: true,
      impact: 'Muito Alto'
    },
    {
      id: '2',
      title: 'Palavras-chave de cauda longa convertendo melhor',
      description: 'Keywords específicas têm 3x mais conversão. Adicione mais ao portfólio.',
      priority: 'high',
      confidence: 93,
      time: '9 min atrás',
      actionable: true,
      impact: 'Alto'
    }
  ]
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getConnectedNetworks() {
  return mockConnectedNetworks;
}

export function getMetricsByPlatform(platform: Platform, period: number | 'today') {
  // Ajustar valores baseado no período (simulação)
  const baseMetrics = mockMetrics[platform];

  // Para simplificação, retornar dados base
  // Em produção real, aqui você faria cálculos baseados no período
  return baseMetrics;
}

export function getFollowersDataByPlatform(platform: Platform) {
  return mockFollowersData[platform];
}

export function getConversionFunnelByPlatform(platform: Platform) {
  return mockConversionFunnel[platform];
}

export function getAIInsightsByPlatform(platform: Platform) {
  return mockAIInsights[platform];
}

export function getFunnelStagesByPlatform(platform: Platform) {
  return funnelStagesByPlatform[platform] || funnelStagesByPlatform.instagram;
}

// Métricas globais consolidadas (todas as redes)
export function getGlobalMetrics() {
  const platforms = Object.keys(mockMetrics) as Platform[];

  const totalImpressions = platforms.reduce((sum, platform) =>
    sum + (mockMetrics[platform].impressions || 0), 0
  );

  const totalClicks = platforms.reduce((sum, platform) =>
    sum + (mockMetrics[platform].clicks || mockMetrics[platform].engagement || 0), 0
  );

  const totalFollowers = platforms.reduce((sum, platform) =>
    sum + (mockFollowersData[platform]?.currentFollowers || mockFollowersData[platform]?.currentSubscribers || 0), 0
  );

  return {
    totalImpressions,
    totalClicks,
    totalFollowers,
    totalNetworks: mockConnectedNetworks.length,
    averageEngagementRate: 7.8,
    totalConversions: 8934
  };
}
