
import { GoogleGenAI } from "@google/genai";
import { HouseType, DesignStyle } from "../types";

const API_KEY = process.env.API_KEY || '';

/**
 * Hàm hỗ trợ tạo thiết kế với cơ chế thử lại (retry)
 */
const generateWithRetry = async (
  ai: any,
  landImageBase64: string,
  prompt: string,
  maxRetries: number = 2
): Promise<{ imageUrl: string; description: string } | null> => {
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: landImageBase64.split(',')[1],
                mimeType: 'image/png',
              },
            },
            { text: prompt },
          ],
        },
      });

      let imageUrl = '';
      let description = '';

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          description += part.text;
        }
      }

      if (imageUrl) {
        return { imageUrl, description };
      }
      
      console.warn(`Lần thử ${attempt + 1} không trả về hình ảnh.`);
    } catch (error) {
      lastError = error;
      console.error(`Lỗi tại lần thử ${attempt + 1}:`, error);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return null;
};

export const generateArchitecturalDesigns = async (
  landImageBase64: string,
  houseType: HouseType,
  style: DesignStyle,
  budget: string,
  landWidth: string,
  landLength: string,
  floors: string,
  frontYardLength: string,
  count: number = 3
): Promise<{ imageUrl: string; description: string }[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const finalResults: { imageUrl: string; description: string }[] = [];
  
  const area = parseFloat(landWidth) * parseFloat(landLength);

  const variations = [
    "Thiết kế tập trung vào sự tối giản, các đường nét kiến trúc sạch sẽ, sử dụng nhiều mảng kính lớn để lấy sáng tự nhiên.",
    "Thiết kế mang hơi hướng sang trọng với các vật liệu cao cấp như đá granite, gỗ tự nhiên và hệ thống chiếu sáng ngoại thất tinh tế.",
    "Thiết kế xanh, tích hợp nhiều bồn hoa, ban công có cây xanh và không gian mở thoáng đãng, kết nối với thiên nhiên."
  ];

  for (let i = 0; i < count; i++) {
    const variationPrompt = variations[i % variations.length];
    const prompt = `YÊU CẦU KIẾN TRÚC CHI TIẾT (PHƯƠNG ÁN ${i + 1}):
    1. HIỆN TRẠNG: Hình ảnh đính kèm là một mảnh đất trống có kích thước ${landWidth}m (ngang) x ${landLength}m (dài), diện tích ${area}m2.
    2. NHIỆM VỤ: Thiết kế một ngôi nhà ${houseType}, quy mô ${floors} tầng, phong cách ${style}.
    3. QUY TẮC VÀNG: Chỉ xây dựng trên phần ĐẤT TRỐNG. Không đè lên nhà lân cận. Ngôi nhà có mặt tiền rộng đúng ${landWidth}m.
    4. KHOẢNG LÙI SÂN TRƯỚC: Phải chừa trống ${frontYardLength}m chiều dài tính từ mặt đường/vỉa hè vào trong làm sân trước. Ngôi nhà bắt đầu xây dựng từ sau khoảng sân ${frontYardLength}m này.
    5. KỸ THUẬT: Phối cảnh khớp góc máy và ánh sáng ảnh gốc. Trông như thật, được xây dựng thực tế.
    6. ĐIỀU KIỆN: Ngân sách ước tính ${budget}.
    7. ĐIỂM NHẤN RIÊNG: ${variationPrompt}
    8. CHẤT LƯỢNG: Ảnh photorealistic 4K.
    9. NGÔN NGỮ: Mô tả phản hồi bằng Tiếng Việt.`;

    const result = await generateWithRetry(ai, landImageBase64, prompt);
    
    if (result) {
      finalResults.push({
        imageUrl: result.imageUrl,
        description: result.description || `Phương án ${i + 1}: Thiết kế ${houseType} ${floors} tầng, chừa sân trước ${frontYardLength}m trên mảnh đất ${landWidth}x${landLength}m.`
      });
    }
  }

  return finalResults;
};

export const editDesign = async (
  currentImageBase64: string,
  editPrompt: string
): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `YÊU CẦU CHỈNH SỬA CHI TIẾT:
  Áp dụng thay đổi sau vào thiết kế hiện tại: "${editPrompt}".
  LƯU Ý: Giữ nguyên cấu trúc chính, diện tích, số tầng và khoảng lùi sân trước. Chỉ thay đổi chi tiết, vật liệu hoặc màu sắc.
  Đảm bảo kết quả chân thực và mô tả bằng Tiếng Việt.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: currentImageBase64.split(',')[1],
            mimeType: 'image/png',
          },
        },
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  return null;
};
