export function Doshuffle<T>(array: T[]): T[] {
  // Copier le tableau d'origine pour ne pas le modifier directement
  const shuffledArray = [...array];

  // Parcourir le tableau en sens inverse
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    // Générer un indice aléatoire entre 0 et i
    const randomIndex = Math.floor(Math.random() * (i + 1));

    // Échanger l'élément courant avec l'élément à l'indice aléatoire
    const temp = shuffledArray[i];
    shuffledArray[i] = shuffledArray[randomIndex];
    shuffledArray[randomIndex] = temp;
  }

  // Retourner le tableau mélangé
  return shuffledArray;
}

export function generateUniqueOrderId() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  const timestamp = now.getTime().toString().slice(-6); // Prendre les 6 derniers chiffres du timestamp
  const randomString = Math.random().toString(36).substring(2, 7).toUpperCase(); // Suite aléatoire de 5 caractères
  const uniquePart = timestamp + randomString; // Fusionner le timestamp et la randomString
  const orderId = `CM-${day}${month}${year}-${uniquePart}`;
  return orderId;
}

export function getDayRange(dateString) {
  const date = new Date(dateString);

  // Début de la journée (00:00:00.000)
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  // Fin de la journée (23:59:59.999)
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function transformDataChartJs(input: any) {
  return {
    categories: input.map((item: { nom: string }) =>
      item.nom.includes(' ') ? item.nom.split(' ') : item.nom,
    ),
    seriesData: [
      {
        data: input.map(
          (item: { totalStockDate: number }) => item.totalStockDate,
        ),
      },
    ],
    numberMax:
      Math.max(
        ...input.map((item: { totalStockDate: number }) => item.totalStockDate),
      ) + 1000,
  };
}
