# Unity项目配置文档

## Unity版本要求

- **Unity版本**: 2022.3 LTS
- **平台**: Android, iOS
- **渲染管线**: Universal Render Pipeline (URP)

---

## 项目结构

```
UnityProject/
├── Assets/
│   ├── Models/              # 3D人物模型
│   │   ├── Female_1/
│   │   ├── Female_2/
│   │   └── Male_1/
│   │
│   ├── Animations/          # 动画文件
│   │   ├── Idle.anim
│   │   ├── Happy.anim
│   │   ├── Sad.anim
│   │   ├── Angry.anim
│   │   ├── Surprised.anim
│   │   ├── Wave.anim
│   │   └── ...
│   │
│   ├── Scenes/              # 背景场景
│   │   ├── Cafe.unity
│   │   ├── Park.unity
│   │   └── ...
│   │
│   ├── Scripts/             # C#脚本
│   │   ├── CharacterController.cs
│   │   ├── LipSyncController.cs
│   │   ├── EmotionController.cs
│   │   ├── MessageHandler.cs
│   │   └── ...
│   │
│   └── Outfits/             # 服装资源
│       ├── Casual_1/
│       ├── Business_1/
│       └── ...
│
└── ProjectSettings/
```

---

## 核心脚本

### 1. MessageHandler.cs

```csharp
using UnityEngine;
using System;

public class MessageHandler : MonoBehaviour
{
    public static MessageHandler Instance { get; private set; }

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    // 接收来自React Native的消息
    public void OnMessageReceived(string message)
    {
        Debug.Log("Received message: " + message);

        try
        {
            var command = JsonUtility.FromJson<UnityCommand>(message);
            ProcessCommand(command);
        }
        catch (Exception e)
        {
            Debug.LogError("Failed to process message: " + e.Message);
            SendMessageToRN(new UnityMessage
            {
                type = "error",
                data = e.Message
            });
        }
    }

    private void ProcessCommand(UnityCommand command)
    {
        switch (command.type)
        {
            case "switchModel":
                CharacterController.Instance.SwitchModel(command.params.modelId);
                break;

            case "changeOutfit":
                CharacterController.Instance.ChangeOutfit(command.params.outfitId);
                break;

            case "playAnimation":
                CharacterController.Instance.PlayAnimation(
                    command.params.animationName,
                    command.params.loop
                );
                break;

            case "setEmotion":
                EmotionController.Instance.SetEmotion(
                    command.params.emotion,
                    command.params.intensity
                );
                break;

            case "setLipSync":
                LipSyncController.Instance.SetVisemeData(command.params.visemeData);
                break;

            case "playAudioWithLipSync":
                LipSyncController.Instance.PlayAudioWithLipSync(
                    command.params.audioUrl,
                    command.params.visemeData
                );
                break;

            case "setCameraView":
                CameraController.Instance.SetView(command.params.viewType);
                break;

            case "setBackground":
                SceneController.Instance.LoadBackground(command.params.backgroundId);
                break;

            default:
                Debug.LogWarning("Unknown command type: " + command.type);
                break;
        }
    }

    // 发送消息到React Native
    public void SendMessageToRN(UnityMessage message)
    {
        string json = JsonUtility.ToJson(message);
        // UnityMessageManager.Instance.SendMessageToRN(json);
        Debug.Log("Sending to RN: " + json);
    }

    [Serializable]
    public class UnityCommand
    {
        public string type;
        public CommandParams params;
    }

    [Serializable]
    public class CommandParams
    {
        public string modelId;
        public string outfitId;
        public string animationName;
        public bool loop;
        public string emotion;
        public float intensity;
        public int[] visemeData;
        public string audioUrl;
        public string viewType;
        public string backgroundId;
    }

    [Serializable]
    public class UnityMessage
    {
        public string type;
        public string data;
    }
}
```

### 2. CharacterController.cs

```csharp
using UnityEngine;
using System.Collections.Generic;

public class CharacterController : MonoBehaviour
{
    public static CharacterController Instance { get; private set; }

    [SerializeField] private GameObject[] characterPrefabs;
    [SerializeField] private Transform characterSpawnPoint;

    private GameObject currentCharacter;
    private Animator animator;
    private SkinnedMeshRenderer[] meshRenderers;

    private Dictionary<string, GameObject> modelCache = new Dictionary<string, GameObject>();

    private void Awake()
    {
        Instance = this;
    }

    public void SwitchModel(string modelId)
    {
        // 销毁当前角色
        if (currentCharacter != null)
        {
            Destroy(currentCharacter);
        }

        // 从缓存或Resources加载新模型
        GameObject prefab = Resources.Load<GameObject>($"Models/{modelId}");
        if (prefab == null)
        {
            Debug.LogError($"Model not found: {modelId}");
            return;
        }

        // 实例化新角色
        currentCharacter = Instantiate(prefab, characterSpawnPoint.position, Quaternion.identity);
        animator = currentCharacter.GetComponent<Animator>();
        meshRenderers = currentCharacter.GetComponentsInChildren<SkinnedMeshRenderer>();

        // 播放默认待机动画
        PlayAnimation("Idle", true);

        // 通知RN模型加载完成
        MessageHandler.Instance.SendMessageToRN(new MessageHandler.UnityMessage
        {
            type = "modelLoaded",
            data = modelId
        });
    }

    public void ChangeOutfit(string outfitId)
    {
        // 加载服装预制件
        GameObject outfit = Resources.Load<GameObject>($"Outfits/{outfitId}");
        if (outfit == null)
        {
            Debug.LogError($"Outfit not found: {outfitId}");
            return;
        }

        // 应用服装材质到角色
        // 具体实现取决于模型结构
    }

    public void PlayAnimation(string animationName, bool loop = false)
    {
        if (animator == null) return;

        animator.Play(animationName);

        if (!loop)
        {
            // 动画播放完成后发送通知
            StartCoroutine(WaitForAnimationEnd(animationName));
        }
    }

    private System.Collections.IEnumerator WaitForAnimationEnd(string animationName)
    {
        // 等待动画播放完成
        while (animator.GetCurrentAnimatorStateInfo(0).IsName(animationName))
        {
            yield return null;
        }

        MessageHandler.Instance.SendMessageToRN(new MessageHandler.UnityMessage
        {
            type = "animationComplete",
            data = animationName
        });
    }
}
```

### 3. LipSyncController.cs

```csharp
using UnityEngine;
using System.Collections;

public class LipSyncController : MonoBehaviour
{
    public static LipSyncController Instance { get; private set; }

    private SkinnedMeshRenderer faceMeshRenderer;
    private int[] currentVisemeData;
    private int visemeIndex = 0;

    // BlendShape索引映射（基于ARKit标准）
    private Dictionary<int, string> visemeToBlendShape = new Dictionary<int, string>
    {
        { 0, "viseme_sil" },
        { 1, "viseme_PP" },
        { 2, "viseme_FF" },
        { 3, "viseme_TH" },
        { 4, "viseme_DD" },
        { 5, "viseme_kk" },
        { 6, "viseme_CH" },
        { 7, "viseme_SS" },
        { 8, "viseme_nn" },
        { 9, "viseme_RR" },
        { 10, "viseme_aa" },
        { 11, "viseme_E" },
        { 12, "viseme_I" },
        { 13, "viseme_O" },
        { 14, "viseme_U" },
    };

    private void Awake()
    {
        Instance = this;
    }

    public void Initialize(SkinnedMeshRenderer renderer)
    {
        faceMeshRenderer = renderer;
    }

    public void SetVisemeData(int[] visemeData)
    {
        currentVisemeData = visemeData;
        visemeIndex = 0;
    }

    public void PlayAudioWithLipSync(string audioUrl, int[] visemeData)
    {
        SetVisemeData(visemeData);

        // 播放音频
        StartCoroutine(PlayAudioCoroutine(audioUrl));

        // 开始口型同步
        StartCoroutine(UpdateLipSyncCoroutine());
    }

    private IEnumerator PlayAudioCoroutine(string audioUrl)
    {
        // 加载并播放音频
        // 实际实现需要使用WWW或UnityWebRequest加载音频
        yield return null;
    }

    private IEnumerator UpdateLipSyncCoroutine()
    {
        if (faceMeshRenderer == null || currentVisemeData == null)
            yield break;

        float frameDuration = 0.05f; // 每个viseme持续50ms

        while (visemeIndex < currentVisemeData.Length)
        {
            int visemeId = currentVisemeData[visemeIndex];
            SetViseme(visemeId, 1.0f);

            yield return new WaitForSeconds(frameDuration);

            visemeIndex++;
        }

        // 重置到静音
        SetViseme(0, 1.0f);
    }

    private void SetViseme(int visemeId, float weight)
    {
        if (!visemeToBlendShape.ContainsKey(visemeId))
            return;

        string blendShapeName = visemeToBlendShape[visemeId];
        int blendShapeIndex = faceMeshRenderer.sharedMesh.GetBlendShapeIndex(blendShapeName);

        if (blendShapeIndex >= 0)
        {
            // 重置所有viseme
            foreach (var kvp in visemeToBlendShape)
            {
                int index = faceMeshRenderer.sharedMesh.GetBlendShapeIndex(kvp.Value);
                if (index >= 0)
                {
                    faceMeshRenderer.SetBlendShapeWeight(index, 0);
                }
            }

            // 设置当前viseme
            faceMeshRenderer.SetBlendShapeWeight(blendShapeIndex, weight * 100);
        }
    }
}
```

### 4. EmotionController.cs

```csharp
using UnityEngine;
using System.Collections;

public class EmotionController : MonoBehaviour
{
    public static EmotionController Instance { get; private set; }

    private SkinnedMeshRenderer faceMeshRenderer;
    private Animator animator;

    private void Awake()
    {
        Instance = this;
    }

    public void Initialize(SkinnedMeshRenderer renderer, Animator anim)
    {
        faceMeshRenderer = renderer;
        animator = anim;
    }

    public void SetEmotion(string emotion, float intensity = 1.0f)
    {
        // 播放情绪动画
        if (animator != null)
        {
            switch (emotion)
            {
                case "happy":
                    animator.SetTrigger("Happy");
                    SetFacialExpression("happy", intensity);
                    break;

                case "sad":
                    animator.SetTrigger("Sad");
                    SetFacialExpression("sad", intensity);
                    break;

                case "angry":
                    animator.SetTrigger("Angry");
                    SetFacialExpression("angry", intensity);
                    break;

                case "surprised":
                    animator.SetTrigger("Surprised");
                    SetFacialExpression("surprised", intensity);
                    break;

                case "neutral":
                default:
                    animator.SetTrigger("Idle");
                    ResetFacialExpression();
                    break;
            }
        }
    }

    private void SetFacialExpression(string emotion, float intensity)
    {
        if (faceMeshRenderer == null) return;

        switch (emotion)
        {
            case "happy":
                SetBlendShape("smile_L", 80 * intensity);
                SetBlendShape("smile_R", 80 * intensity);
                SetBlendShape("eyeSquint_L", 30 * intensity);
                SetBlendShape("eyeSquint_R", 30 * intensity);
                break;

            case "sad":
                SetBlendShape("frown_L", 70 * intensity);
                SetBlendShape("frown_R", 70 * intensity);
                SetBlendShape("mouthFrown_L", 60 * intensity);
                SetBlendShape("mouthFrown_R", 60 * intensity);
                break;

            case "angry":
                SetBlendShape("browInnerUp", 60 * intensity);
                SetBlendShape("eyeSquint_L", 80 * intensity);
                SetBlendShape("eyeSquint_R", 80 * intensity);
                SetBlendShape("mouthFrown_L", 80 * intensity);
                SetBlendShape("mouthFrown_R", 80 * intensity);
                break;

            case "surprised":
                SetBlendShape("browOuterUp_L", 90 * intensity);
                SetBlendShape("browOuterUp_R", 90 * intensity);
                SetBlendShape("eyeWide_L", 90 * intensity);
                SetBlendShape("eyeWide_R", 90 * intensity);
                SetBlendShape("mouthOpen", 60 * intensity);
                break;
        }
    }

    private void ResetFacialExpression()
    {
        if (faceMeshRenderer == null) return;

        for (int i = 0; i < faceMeshRenderer.sharedMesh.blendShapeCount; i++)
        {
            faceMeshRenderer.SetBlendShapeWeight(i, 0);
        }
    }

    private void SetBlendShape(string shapeName, float weight)
    {
        int index = faceMeshRenderer.sharedMesh.GetBlendShapeIndex(shapeName);
        if (index >= 0)
        {
            faceMeshRenderer.SetBlendShapeWeight(index, weight);
        }
    }
}
```

---

## 构建配置

### Android

1. **Player Settings**:
   - Minimum API Level: 24 (Android 7.0)
   - Target API Level: 33+
   - Scripting Backend: IL2CPP
   - Target Architectures: ARM64

2. **Graphics**:
   - Graphics API: OpenGLES3 / Vulkan
   - Color Space: Linear

### iOS

1. **Player Settings**:
   - Target Minimum iOS Version: 13.0
   - Architecture: ARM64
   - Camera Usage Description: "需要访问摄像头"

2. **Graphics**:
   - Graphics API: Metal
   - Color Space: Linear

---

## 导出为React Native插件

1. 使用 `react-native-unity` 工具
2. 导出Android: `File -> Build Settings -> Export Project`
3. 导出iOS: `File -> Build Settings -> Build`
4. 集成到React Native项目

---

## 3D模型要求

### 格式
- FBX或GLTF/GLB格式
- 带骨骼绑定（Rigged）
- 包含BlendShapes（至少52个ARKit标准BlendShapes）

### 优化
- 多边形数: < 20,000
- 纹理尺寸: 2048x2048或以下
- 骨骼数量: < 100

### BlendShapes要求

必须包含以下BlendShapes用于表情和口型：

**表情**:
- smile_L, smile_R
- frown_L, frown_R
- eyeWide_L, eyeWide_R
- eyeSquint_L, eyeSquint_R
- browInnerUp, browOuterUp_L, browOuterUp_R
- mouthOpen, mouthFrown_L, mouthFrown_R

**口型（Viseme）**:
- viseme_sil (静音)
- viseme_PP, viseme_FF, viseme_TH
- viseme_DD, viseme_kk, viseme_CH
- viseme_SS, viseme_nn, viseme_RR
- viseme_aa, viseme_E, viseme_I, viseme_O, viseme_U

---

## 资源准备

### 推荐来源

1. **Ready Player Me**: https://readyplayer.me/
   - 免费，可自定义
   - 自动包含BlendShapes
   - 导出GLB格式

2. **VRoid Studio**: https://vroid.com/
   - 免费，二次元风格
   - 导出VRM格式（需转换）

3. **Unity Asset Store**:
   - Realistic People
   - Synty Studios角色包

---

**文档版本**: v1.0
**最后更新**: 2026-02-04
