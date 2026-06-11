using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

namespace CryptoAlbumCopa.Services
{
    [Serializable]
    public class GeoStatusResponse
    {
        public bool packsAllowed;
        public bool stakingAllowed;
        public string countryCode;
        public string countryName;
        public string source;
        public bool vpnRisk;
        public BlockedJurisdictionsData blockedJurisdictions;
    }

    [Serializable]
    public class BlockedJurisdictionsData
    {
        public string[] blockedForPacks;
        public string[] blockedForStaking;
    }

    public class GeofenceService : MonoBehaviour
    {
        public static GeofenceService Instance { get; private set; }

        [Header("Config")]
        public string apiBaseUrl = "http://localhost:3001";

        [Header("Status (read-only)")]
        public bool isReady = false;
        public bool packsAllowed = true;
        public bool stakingAllowed = true;
        public string countryName = "";
        public string countryCode = "";
        public bool vpnRisk = false;

        void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            StartCoroutine(FetchGeoStatus());
        }

        private IEnumerator FetchGeoStatus()
        {
            using (var req = UnityWebRequest.Get($"{apiBaseUrl}/compliance/geofence-status"))
            {
                req.timeout = 5;
                yield return req.SendWebRequest();

                if (req.result == UnityWebRequest.Result.Success)
                {
                    try
                    {
                        var data = JsonUtility.FromJson<GeoStatusResponse>(req.downloadHandler.text);
                        if (data != null)
                        {
                            packsAllowed = data.packsAllowed;
                            stakingAllowed = data.stakingAllowed;
                            countryName = data.countryName ?? "";
                            countryCode = data.countryCode ?? "";
                            vpnRisk = data.vpnRisk;
                            Debug.Log($"[Geofence] OK — {countryCode} packs={packsAllowed} staking={stakingAllowed}");
                        }
                    }
                    catch (Exception e)
                    {
                        Debug.LogWarning($"[Geofence] Parse error: {e.Message}");
                    }
                }
                else
                {
                    Debug.Log($"[Geofence] API unreachable ({req.result}). Default: all allowed.");
                }
            }
            isReady = true;
        }
    }
}
