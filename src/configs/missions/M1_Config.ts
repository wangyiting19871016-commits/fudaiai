/**
 * 🎯 M1: 马年3D皮克斯头像 - 完整配置
 * 
 * Version: v1.0_Final_Golden
 * 更新时间: 2026-01-26
 */

export interface M1Config {
  mission_id: string;
  version: string;
  description: string;
  
  model_config: {
    base_model: string;
    lora: {
      uuid: string;
      trigger_word: string;
      weight: number;
      /** 男生专用 LoRA 权重，略低以减轻幼态；不设则用 weight */
      male_weight?: number;
    };
    params: {
      aspect_ratio: string;
      cfg_scale: number;
      steps: number;
      sampler: string;
    };
  };
  
  qwen_config: {
    system_prompt: string;
  };
  
  prompt_templates: {
    male: {
      positive: string;
      negative: string;
    };
    female: {
      positive: string;
      negative: string;
    };
  };
}

export const M1_CONFIG: M1Config = {
  mission_id: "M1_Pixar_Avatar",
  version: "v1.0_Final_Golden",
  description: "新年3D皮克斯风格头像生成任务",
  
  model_config: {
    base_model: "flux.1-dev",
    lora: {
      uuid: "95ec78a639394f48827c31adabc00828",
      trigger_word: "pks",
      weight: 0.4,
      male_weight: 0.35  // 男生略降，减轻幼态 prior
    },
    params: {
      aspect_ratio: "3:4",
      cfg_scale: 3.5,
      steps: 25,
      sampler: "euler"
    }
  },

  qwen_config: {
    system_prompt: `Analyze this portrait photo. Describe ONLY these key features in EXTREME detail (they are critical for identity):

1. HEADWEAR (帽子/头饰):
   - Type: baseball cap / beanie / fedora / sun hat / headband / hair clip / or "no headwear"
   - Color: black / gray / white / brown / etc.
   - Example: "black baseball cap" / "gray wool beanie" / "no headwear"

2. GLASSES (眼镜 - 必须详细):
   - If wearing: frame shape + frame color + thickness
     * Frame shapes: rectangular / square / round / oval / cat-eye / aviator
     * Frame colors: black / brown / gold / silver / transparent
     * Thickness: thick-framed / thin-framed / medium-framed
   - Examples: "wearing rectangular thick black-framed glasses" / "wearing round thin gold-rimmed glasses" / "no glasses"

3. EARRINGS/EARWEAR (耳饰):
   - ONLY mention if clearly visible (do NOT write "no earrings" if not visible)
   - Type: hoop earrings / stud earrings / drop earrings / dangly earrings
   - Color/material: gold / silver / pearl / red / etc.
   - Example: "wearing gold hoop earrings" / "wearing red tassel earrings"

4. HAIR (发型 - 最关键特征，必须超详细精准描述):
   ⚠️ CRITICAL: Hair is THE MOST IMPORTANT identifying feature. Be extremely detailed and precise.

   Describe in this order:
   A. LENGTH: very short (buzz/crew cut) / short cropped / medium / shoulder-length / long

   B. EXACT STYLE & STRUCTURE:
      * Short hair: buzz cut / crew cut / cropped / spiky / textured / slicked back / side-parted / messy / undercut
      * Medium/Long: straight down / pulled back / loose / in ponytail / tied up / braided / half-up / flowing
      * IMPORTANT: Only mention "bun" / "ponytail" / "tied" if CLEARLY visible

   C. TOP/CROWN DETAIL (CRITICAL for recognition):
      * Describe volume: flat on top / slightly lifted / with volume / very voluminous / puffed up
      * Describe styling: combed forward / combed back / standing up / messy on top / neat on top

   D. SIDES & BACK:
      * tapered sides / buzzed sides / long sides / undercut sides / shaved sides
      * back style: tapered / faded / long / layered

   E. TEXTURE: straight smooth / slightly wavy / wavy / curly / coily / textured

   F. COLOR: black / dark brown / light brown / gray / white / mixed gray-black / dyed

   G. BANGS/FRONT (be specific):
      * "side-swept bangs" / "center-parted" / "short front hair" / "minimal bangs" / "no distinct bangs" / "forehead fully visible"
      * Only use "side-swept" when hair is clearly swept to side

   GOOD Examples (ultra-detailed):
   - "very short dark brown buzz cut, flat on top, tapered sides and back, no bangs, forehead visible"
   - "short black hair with volume on top, textured and slightly messy, tapered sides, short front hair combed forward"
   - "medium length black hair, slightly wavy texture, combed back, loose on sides, no bangs"
   - "long straight black hair flowing down to shoulders, center-parted, no bangs, smooth texture"
   - "short cropped black hair, puffed up on top with volume, undercut sides, minimal front hair"

5. FACE SHAPE (脸型):
   - Overall: round soft / oval balanced / square wide / elongated narrow / heart-shaped
   - Jawline: sharp defined / soft rounded / broad wide
   - Cheeks: high prominent cheekbones / flat soft / full rounded cheeks

6. AGE (年龄 - 只分3类，去掉中年避免模板同质化):
   - For child (under 18): "child" or "young teenager"
   - For young adult (18-45): ALWAYS use "young adult" or "adult" (DO NOT use "mature" or "middle-aged")
   - For elder (50+): "elder senior woman/man" or "elderly woman/man"
   - IMPORTANT: Ages 30-45 should still use "young adult" to avoid middle-aged template issues

7. GENDER: male or female

8. CLOTHING (衣服 - 大致描述即可，不需要太详细):
   - Type: casual shirt / t-shirt / sweater / hoodie / jacket / coat / dress / suit / traditional clothing
   - Color: main color (black / white / red / blue / gray / etc.)
   - Style: casual / formal / sporty / traditional
   - Example: "red casual sweater", "black formal suit jacket", "white t-shirt", "blue hoodie"
   - If unclear or not visible: "casual clothing" or "upper body clothing"

9. POSE (姿势/动作 - 简单描述):
   - Body position: standing upright / sitting / upper body only / portrait shot
   - Arms/hands position: arms crossed / hands in pockets / arms at sides / holding something / hands clasped
   - Example: "standing, arms at sides", "upper body shot, arms crossed", "portrait, natural pose"
   - Keep it simple and natural

OUTPUT FORMAT:
- Return a single line.
- Comma-separated detailed English description.
- Do NOT wrap the output in quotes.
- Mention gender only once (male OR female).
- For male age, always include an explicit adult anchor phrase like: "mature 35 adult man" or "man with mature facial features".
- NO explanations.

GOOD Examples (super detailed):
- "black baseball cap, wearing rectangular thick black-framed glasses, medium length black hair with gray strands pulled under cap, square face, sharp jawline, high cheekbones, elder senior woman, female, gray coat, upper body shot"
- "wearing round thin gold-rimmed glasses, very short dark brown buzz cut flat on top with tapered sides, wide square face, broad jawline, young adult man, male, black casual jacket, standing with arms at sides"
- "short cropped black hair slightly lifted on top, oval face, soft jawline, young adult, male, white t-shirt, portrait shot"
- "long straight black hair flowing down, oval face, soft rounded jawline, young adult, female, red sweater, upper body with natural pose"
- "wearing silver stud earrings, shoulder-length wavy brown hair, round face, young adult woman, female, blue cardigan, portrait shot"

CRITICAL:
- Describe EXACTLY what you see. Do NOT assume or add features that are not clearly visible.
- Do NOT write "no earrings" or "no headwear" - only mention accessories if you actually see them
- For males: most do NOT wear earrings - ONLY mention if clearly visible and certain
- If no accessories visible: simply omit accessories from the description

BAD Examples (too vague):
- "hat, glasses, long hair, female" ← TOO VAGUE!
- "short hair, male" ← TOO VAGUE!`
  },

  prompt_templates: {
    male: {
      positive: "pks, (masterpiece), 3d pixar animation style, ({{HAIR_AGE}}:4.0), ({{ACCESSORIES}}:3.2), ({{FACE}}:2.2), adult male proportions, wearing a vibrant red traditional Chinese silk jacket with gold dragon patterns, holding a shiny golden ingot (Yuanbao), soft cinematic lighting, bokeh festive background, high-end 3d character design, rendered in Octane, stylized movie look, vibrant colors, clean smooth surfaces",
      negative: "--no (realistic photo:1.5), (photorealistic:1.5), photograph, low quality, distorted, baby face, youthful, teen, child, toddler, boy, kid, childish face, chibi, big head, small body, cute, kawaii, wrong hairstyle, different hair color, different hair length, bald when should have hair"
    },
    female: {
      positive: "pks, (masterpiece), 3d pixar animation style, ({{HAIR_AGE}}:4.2), ({{ACCESSORIES}}:3.5), ({{FACE}}:2.0), refined facial proportions, wearing a vibrant red traditional Chinese silk jacket with gold dragon patterns, holding a shiny golden ingot (Yuanbao), character portrait, bokeh festive background, high-end 3d character design, rendered in Octane, stylized movie look, vibrant colors, clean smooth surfaces",
      negative: "--no (realistic photo:1.5), (photorealistic:1.5), photograph, low quality, distorted, baby face, youthful, smooth young skin, teen, child, cute innocent, chibi, big head, small body, wrong hairstyle, different hair color, different hair length, bald when should have hair"
    }
  }
};

/**
 * 🆕 导出多风格配置（支持水彩、赛博朋克等新风格）
 */
export { M1_STYLES, getM1Style, getAllM1Styles, getM1StylesList } from './M1_Styles';
