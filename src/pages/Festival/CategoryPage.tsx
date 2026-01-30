import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCategoryById } from '../../configs/festival/categories';
import { getFeaturesByCategory, Feature, isLegacyFeature } from '../../configs/festival/features';
import '../../styles/festival.css';

/**
 * 📂 分类页
 *
 * 展示某个分类下的所有功能
 * 如：新年形象下有 3D头像、财神变身 等
 */

const FestivalCategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const category = getCategoryById(categoryId || '');
  const features = getFeaturesByCategory(categoryId || '');

  if (!category) {
    return (
      <div className="festival-layout">
        <div className="festival-category-page">
          <div className="category-error">
            <h2>分类未找到</h2>
            <button onClick={() => navigate('/festival/home')}>返回首页</button>
          </div>
        </div>
      </div>
    );
  }

  // 点击功能进入功能页
  const handleFeatureClick = (feature: Feature) => {
    const processType = feature.process.type;

    // 图片类功能
    if (processType === 'image') {
      // 判断是否需要模板选择
      if (feature.input.needTemplate) {
        // 需要模板选择：M1/M2/M3/M4
        navigate(`/festival/template-select/${feature.id}`);
      } else if (isLegacyFeature(feature.id)) {
        // 旧版遗留功能
        navigate(`/festival/template-select/${feature.id}`);
      } else {
        // 其他新功能（如果有的话）
        navigate(`/festival/lab/${feature.id}`);
      }
      return;
    }

    // 文案类功能
    if (processType === 'text') {
      navigate(`/festival/text/${feature.id}`);
      return;
    }

    // 语音类功能
    if (processType === 'audio') {
      navigate('/festival/voice');
      return;
    }
  };

  // 获取功能的免费次数显示
  const renderFreeQuota = (feature: Feature) => {
    const { access } = feature;

    if (access.freePerDay === -1) {
      return <span className="feature-quota free">免费无限</span>;
    }

    return (
      <span className="feature-quota">
        免费{access.freePerDay}次/天
        {access.freeWatermark && '，带水印'}
      </span>
    );
  };

  return (
    <div className="festival-layout">
      <div className="festival-category-page">
        {/* 顶部导航 */}
        <div className="category-header">
          <button className="back-btn" onClick={() => navigate('/festival/home')}>
            ← 返回
          </button>
          <h1 className="category-title">{category.icon} {category.name}</h1>
          <div className="header-placeholder"></div>
        </div>

        {/* 功能列表 */}
        <div className="feature-grid">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="feature-card"
              onClick={() => handleFeatureClick(feature)}
            >
              {/* 预览图占位 */}
              <div className="feature-preview">
                <div className="feature-icon-large">{feature.icon}</div>
              </div>

              {/* 功能信息 */}
              <div className="feature-info">
                <h3 className="feature-name">{feature.name}</h3>
                <p className="feature-desc">{feature.subtitle}</p>
                {renderFreeQuota(feature)}
              </div>
            </div>
          ))}
        </div>

        {/* 礼包提示 */}
        <div className="package-tip">
          <span>🎁 购买春节大礼包 ¥19.9，全部功能无限用</span>
          <button onClick={() => navigate('/festival/vip')}>立即购买</button>
        </div>
      </div>
    </div>
  );
};

export default FestivalCategoryPage;
