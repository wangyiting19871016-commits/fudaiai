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

⚠️ IMPORTANT: Do NOT describe hair/hairstyle - it will be controlled by ControlNet edge detection.

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
   - Type: hoop earrings / stud earrings / drop earrings / dangly earrings / or "no earrings"
   - Color/material: gold / silver / pearl / red / etc.
   - Example: "wearing gold hoop earrings" / "wearing red tassel earrings" / "no earrings"

4. FACE SHAPE (脸型):
   - Overall: round soft / oval balanced / square wide / elongated narrow / heart-shaped
   - Jawline: sharp defined / soft rounded / broad wide
   - Cheeks: high prominent cheekbones / flat soft / full rounded cheeks

5. AGE (年龄 - 必须精准):
   - For 20s: "young 20s"
   - For 30-40s female: "mature 30s" or "mature 40s"
   - For 30-40s male: use explicit adult terms e.g. "mature 35 adult man" or "male in his 30s" or "man with mature facial features" so the model keeps adult appearance
   - For 50-60s: "elder 50s senior woman/man" or "elder 60s senior woman/man"
   - For 70s+: "senior 70s elderly woman/man"

6. GENDER: male or female

OUTPUT FORMAT:
- Return a single line.
- Comma-separated detailed English description.
- Do NOT wrap the output in quotes.
- Do NOT describe hair/hairstyle (will be handled by ControlNet).
- Mention gender only once (male OR female).
- For male age, always include an explicit adult anchor phrase like: "mature 35 adult man" or "man with mature facial features".
- NO explanations.

GOOD Examples (no hair description):
- "black baseball cap, wearing rectangular thick black-framed glasses, no earrings, square face, sharp jawline, high cheekbones, elder 60s senior woman, female"
- "no headwear, wearing round thin gold-rimmed glasses, wearing small gold stud earrings, wide square face, broad jawline, mature 35 adult man, male"
- "no hat, no glasses, wearing red tassel drop earrings, oval face, soft rounded jawline, young 25, female"

BAD Examples (too vague or includes hair):
- "hat, glasses, long hair, female" ← TOO VAGUE and has hair!
- "short hair, male" ← TOO VAGUE and has hair!
- "black hair, glasses, female" ← Has hair description!`
  },

  prompt_templates: {
    male: {
      positive: "pks, (masterpiece), 3d pixar animation style, ({{QWEN_OUTPUT}}:2.6), (mature 35 adult man:1.8), adult male proportions, defined jawline, wearing a vibrant red traditional Chinese silk jacket with gold dragon patterns, holding a shiny golden ingot (Yuanbao), soft cinematic lighting, bokeh festive background, high-end 3d character design, rendered in Octane, stylized movie look, vibrant colors, clean smooth surfaces",
      negative: "--no snake, reptile, low quality, distorted, baby face, youthful, teen, child, toddler, boy, kid, childish face, chibi, big head, small body, cute, kawaii"
    },
    female: {
      positive: "pks, (masterpiece), 3d pixar animation style, ({{QWEN_OUTPUT}}:3.0), mature adult woman, refined facial proportions, wearing a vibrant red traditional Chinese silk jacket with gold dragon patterns, holding a shiny golden ingot (Yuanbao), character portrait, bokeh festive background, high-end 3d character design, rendered in Octane, stylized movie look, vibrant colors, clean smooth surfaces",
      negative: "--no snake, reptile, low quality, distorted, baby face, youthful, smooth young skin, teen, child, cute innocent, chibi, big head, small body"
    }
  }
};
