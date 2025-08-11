// 東京駅周辺の図書館モックデータ（カーリルAPI形式: 経度,緯度）
export const mockLibraries = [
  {
    id: "Chiyoda_Central_Library",
    name: "千代田区立日比谷図書文化館",
    shortName: "日比谷図書文化館",
    address: "東京都千代田区日比谷公園1-4",
    tel: "03-3502-3340",
    url: "https://www.library.chiyoda.tokyo.jp/",
    distance: 1.2,
    category: "LARGE",
    geocode: "139.7594,35.6741",
    isil: "JP-1000001"
  },
  {
    id: "Chuo_Kyoboshi_Library",
    name: "中央区立京橋図書館",
    shortName: "京橋図書館",
    address: "東京都中央区京橋2-6-7",
    tel: "03-3561-0968",
    url: "https://www.library.city.chuo.tokyo.jp/",
    distance: 0.7,
    category: "MEDIUM",
    geocode: "139.7709,35.6751",
    isil: "JP-1000002"
  },
  {
    id: "Chuo_Chuo_Library",
    name: "中央区立中央図書館",
    shortName: "中央区立中央図書館",
    address: "東京都中央区明石町12-1",
    tel: "03-3543-9025",
    url: "https://www.library.city.chuo.tokyo.jp/",
    distance: 1.8,
    category: "LARGE",
    geocode: "139.7735,35.6694",
    isil: "JP-1000003"
  },
  {
    id: "National_Diet_Library",
    name: "国立国会図書館東京本館",
    shortName: "国会図書館",
    address: "東京都千代田区永田町1-10-1",
    tel: "03-3581-2331",
    url: "https://www.ndl.go.jp/",
    distance: 2.1,
    category: "SPECIAL",
    geocode: "139.7431,35.6782",
    isil: "JP-1000004"
  },
  {
    id: "Chiyoda_Kanda_Library",
    name: "千代田区立神田まちかど図書館",
    shortName: "神田まちかど図書館",
    address: "東京都千代田区神田司町2-16",
    tel: "03-3256-6061",
    url: "https://www.library.chiyoda.tokyo.jp/",
    distance: 1.1,
    category: "SMALL",
    geocode: "139.7632,35.6916",
    isil: "JP-1000005"
  },
  {
    id: "Minato_Akasaka_Library", 
    name: "港区立赤坂図書館",
    shortName: "赤坂図書館",
    address: "東京都港区赤坂4-18-21",
    tel: "03-3408-5090",
    url: "https://www.lib.city.minato.tokyo.jp/",
    distance: 2.3,
    category: "MEDIUM",
    geocode: "139.7364,35.6779",
    isil: "JP-1000006"
  }
];

// 東京駅の位置情報
export const mockUserLocation = {
  latitude: 35.6812,
  longitude: 139.7671,
  accuracy: 10
};