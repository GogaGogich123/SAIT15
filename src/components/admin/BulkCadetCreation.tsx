import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Save, 
  FileText,
  AlertCircle,
  CheckCircle,
  UserPlus,
  FileSpreadsheet,
  Eye,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { createCadetWithAuth } from '../../lib/admin';
import { staggerContainer, staggerItem } from '../../utils/animations';

interface CadetData {
  name: string;
  platoon: string;
  squad: number;
  email: string;
  password: string;
  phone?: string;
  avatar_url?: string;
}

const BulkCadetCreation: React.FC = () => {
  const [cadets, setCadets] = useState<CadetData[]>([]);
  const [newCadet, setNewCadet] = useState<CadetData>({
    name: '',
    platoon: '',
    squad: 1,
    email: '',
    password: '',
    phone: '',
    avatar_url: ''
  });
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<{ success: string[], errors: string[] }>({ success: [], errors: [] });
  const [showPreview, setShowPreview] = useState(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const platoons = ['7-1', '7-2', '8-1', '8-2', '9-1', '9-2', '10-1', '10-2', '11-1', '11-2'];
  const squads = [1, 2, 3];

  // Функция для транслитерации кириллицы в латиницу
  const transliterate = (text: string): string => {
    const transliterationMap: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
      'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
      'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
      'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
      'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    };

    return text.split('').map(char => transliterationMap[char] || char).join('');
  };

  // Функция для генерации email из имени
  const generateEmail = (name: string): string => {
    const nameParts = name.trim().split(' ');
    if (nameParts.length >= 2) {
      const lastName = transliterate(nameParts[0]).toLowerCase();
      const firstName = transliterate(nameParts[1]).toLowerCase();
      return `${lastName}.${firstName}@nkkk.ru`;
    }
    return `${transliterate(name).toLowerCase().replace(/\s+/g, '.')}@nkkk.ru`;
  };

  // Функция для генерации пароля из имени
  const generatePassword = (name: string): string => {
    const nameParts = name.trim().split(' ');
    if (nameParts.length >= 2) {
      const lastName = transliterate(nameParts[0]).toLowerCase();
      const firstName = transliterate(nameParts[1]).toLowerCase();
      return `${lastName}${firstName}123PK`;
    }
    return `${transliterate(name).toLowerCase().replace(/\s+/g, '')}123PK`;
  };

  // Обработка загрузки Excel файла
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Берем первый лист
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Конвертируем в JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        setExcelData(jsonData);
        setShowPreview(true);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        alert('Ошибка чтения Excel файла. Убедитесь, что файл имеет правильный формат.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Парсинг данных из Excel
  const parseExcelData = () => {
    if (excelData.length < 2) {
      alert('Excel файл должен содержать заголовки и данные');
      return;
    }

    const headers = excelData[0] as string[];
    const rows = excelData.slice(1);

    // Ищем индексы нужных колонок
    const nameIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('имя') || h.toLowerCase().includes('фио') || h.toLowerCase().includes('name'))
    );
    const platoonIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('взвод') || h.toLowerCase().includes('platoon') || h.toLowerCase().includes('класс'))
    );
    const squadIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('отделение') || h.toLowerCase().includes('squad') || h.toLowerCase().includes('группа'))
    );
    const phoneIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('телефон') || h.toLowerCase().includes('phone'))
    );

    if (nameIndex === -1) {
      alert('Не найдена колонка с именами. Убедитесь, что есть колонка "ФИО", "Имя" или "Name"');
      return;
    }

    if (platoonIndex === -1) {
      alert('Не найдена колонка с взводами. Убедитесь, что есть колонка "Взвод", "Platoon" или "Класс"');
      return;
    }

    const parsedCadets: CadetData[] = [];

    rows.forEach((row: any[], index) => {
      const name = row[nameIndex]?.toString().trim();
      const platoon = row[platoonIndex]?.toString().trim();
      const squad = squadIndex !== -1 ? parseInt(row[squadIndex]?.toString()) || 1 : 1;
      const phone = phoneIndex !== -1 ? row[phoneIndex]?.toString().trim() : '';

      if (name && platoon) {
        const email = generateEmail(name);
        const password = generatePassword(name);

        parsedCadets.push({
          name,
          platoon,
          squad,
          email,
          password,
          phone,
          avatar_url: ''
        });
      }
    });

    setCadets([...cadets, ...parsedCadets]);
    setShowPreview(false);
    setExcelData([]);
    alert(`Добавлено ${parsedCadets.length} кадетов из Excel файла`);
  };

  // Скачивание шаблона Excel
  const downloadTemplate = () => {
    const templateData = [
      ['ФИО', 'Взвод', 'Отделение', 'Телефон'],
      ['Иванов Иван Иванович', '10-1', '1', '+7 (999) 123-45-67'],
      ['Петров Петр Петрович', '10-1', '2', '+7 (999) 123-45-68'],
      ['Сидоров Сидор Сидорович', '10-2', '1', '+7 (999) 123-45-69']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Кадеты');
    
    // Устанавливаем ширину колонок
    ws['!cols'] = [
      { width: 30 }, // ФИО
      { width: 10 }, // Взвод
      { width: 12 }, // Отделение
      { width: 20 }  // Телефон
    ];

    XLSX.writeFile(wb, 'template_cadets.xlsx');
  };

  // Добавление одного кадета в список
  const addCadet = () => {
    if (!newCadet.name || !newCadet.platoon || !newCadet.squad) {
      alert('Заполните обязательные поля');
      return;
    }

    const email = generateEmail(newCadet.name);
    const password = generatePassword(newCadet.name);

    const cadetToAdd: CadetData = {
      ...newCadet,
      email,
      password
    };

    setCadets([...cadets, cadetToAdd]);
    setNewCadet({
      name: '',
      platoon: '',
      squad: 1,
      email: '',
      password: '',
      phone: '',
      avatar_url: ''
    });
  };

  // Удаление кадета из списка
  const removeCadet = (index: number) => {
    setCadets(cadets.filter((_, i) => i !== index));
  };

  // Массовое создание кадетов
  const createAllCadets = async () => {
    if (cadets.length === 0) {
      alert('Добавьте кадетов в список');
      return;
    }

    if (!confirm(`Вы уверены, что хотите создать ${cadets.length} кадетов?`)) {
      return;
    }

    setCreating(true);
    setProgress({ current: 0, total: cadets.length });
    setResults({ success: [], errors: [] });

    const successList: string[] = [];
    const errorList: string[] = [];

    for (let i = 0; i < cadets.length; i++) {
      const cadet = cadets[i];
      setProgress({ current: i + 1, total: cadets.length });

      try {
        await createCadetWithAuth(cadet);
        successList.push(`${cadet.name} (${cadet.platoon} взвод)`);
      } catch (error) {
        console.error(`Error creating cadet ${cadet.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        errorList.push(`${cadet.name}: ${errorMessage}`);
      }

      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setResults({ success: successList, errors: errorList });
    setCreating(false);

    if (errorList.length === 0) {
      alert(`Все ${successList.length} кадетов успешно созданы!`);
      setCadets([]);
    } else {
      alert(`Создано: ${successList.length}, Ошибок: ${errorList.length}`);
    }
  };

  // Очистка списка
  const clearList = () => {
    if (confirm('Вы уверены, что хотите очистить весь список?')) {
      setCadets([]);
    }
  };

  // Экспорт списка кадетов в Excel
  const exportToExcel = () => {
    if (cadets.length === 0) {
      alert('Список кадетов пуст');
      return;
    }

    const exportData = [
      ['ФИО', 'Взвод', 'Отделение', 'Email', 'Пароль', 'Телефон'],
      ...cadets.map(cadet => [
        cadet.name,
        cadet.platoon,
        cadet.squad,
        cadet.email,
        cadet.password,
        cadet.phone || ''
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Кадеты');
    
    // Устанавливаем ширину колонок
    ws['!cols'] = [
      { width: 30 }, // ФИО
      { width: 10 }, // Взвод
      { width: 12 }, // Отделение
      { width: 25 }, // Email
      { width: 20 }, // Пароль
      { width: 20 }  // Телефон
    ];

    XLSX.writeFile(wb, `cadets_list_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Массовое добавление кадетов</h2>
          <p className="text-blue-200">Добавляйте кадетов вручную или загружайте из Excel файла</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-blue-300 font-semibold">
            В списке: {cadets.length} кадетов
          </span>
        </div>
      </motion.div>

      {/* Excel Import Section */}
      <motion.div variants={staggerItem} className="card-hover p-8">
        <div className="flex items-center space-x-3 mb-6">
          <FileSpreadsheet className="h-8 w-8 text-green-400" />
          <h3 className="text-2xl font-bold text-white">Импорт из Excel</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Download Template */}
          <div className="text-center">
            <button
              onClick={downloadTemplate}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 mb-4"
            >
              <Download className="h-5 w-5" />
              <span>Скачать шаблон</span>
            </button>
            <p className="text-blue-300 text-sm">
              Скачайте шаблон Excel файла с примерами данных
            </p>
          </div>

          {/* Upload File */}
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 mb-4"
            >
              <Upload className="h-5 w-5" />
              <span>Загрузить Excel</span>
            </button>
            <p className="text-blue-300 text-sm">
              Загрузите заполненный Excel файл с данными кадетов
            </p>
          </div>

          {/* Export Current List */}
          <div className="text-center">
            <button
              onClick={exportToExcel}
              disabled={cadets.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 mb-4 disabled:cursor-not-allowed"
            >
              <FileText className="h-5 w-5" />
              <span>Экспорт списка</span>
            </button>
            <p className="text-blue-300 text-sm">
              Экспортируйте текущий список кадетов в Excel
            </p>
          </div>
        </div>

        {/* Format Instructions */}
        <div className="mt-8 bg-blue-500/10 border border-blue-400/30 rounded-xl p-6">
          <h4 className="text-lg font-bold text-white mb-4">Формат Excel файла:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-200">
            <div>
              <h5 className="font-semibold text-white mb-2">Обязательные колонки:</h5>
              <ul className="space-y-1 text-sm">
                <li>• <strong>ФИО</strong> - Полное имя кадета</li>
                <li>• <strong>Взвод</strong> - Номер взвода (7-1, 8-2, и т.д.)</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-2">Дополнительные колонки:</h5>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Отделение</strong> - Номер отделения (1, 2, 3)</li>
                <li>• <strong>Телефон</strong> - Номер телефона</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
            <p className="text-yellow-200 text-sm">
              <strong>Примечание:</strong> Email и пароли будут сгенерированы автоматически по формуле:
              <br />• Email: фамилия.имя@nkkk.ru
              <br />• Пароль: фамилияимя123PK
            </p>
          </div>
        </div>
      </motion.div>

      {/* Manual Add Section */}
      <motion.div variants={staggerItem} className="card-hover p-8">
        <div className="flex items-center space-x-3 mb-6">
          <UserPlus className="h-8 w-8 text-blue-400" />
          <h3 className="text-2xl font-bold text-white">Добавить кадета вручную</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-white font-bold mb-2">
              ФИО <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={newCadet.name}
              onChange={(e) => setNewCadet({...newCadet, name: e.target.value})}
              className="input"
              placeholder="Иванов Иван Иванович"
            />
          </div>

          <div>
            <label className="block text-white font-bold mb-2">
              Взвод <span className="text-red-400">*</span>
            </label>
            <select
              value={newCadet.platoon}
              onChange={(e) => setNewCadet({...newCadet, platoon: e.target.value})}
              className="input"
            >
              <option value="">Выберите взвод</option>
              {platoons.map(platoon => (
                <option key={platoon} value={platoon}>{platoon} взвод</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white font-bold mb-2">
              Отделение <span className="text-red-400">*</span>
            </label>
            <select
              value={newCadet.squad}
              onChange={(e) => setNewCadet({...newCadet, squad: parseInt(e.target.value)})}
              className="input"
            >
              {squads.map(squad => (
                <option key={squad} value={squad}>{squad} отделение</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white font-bold mb-2">Телефон</label>
            <input
              type="tel"
              value={newCadet.phone}
              onChange={(e) => setNewCadet({...newCadet, phone: e.target.value})}
              className="input"
              placeholder="+7 (999) 123-45-67"
            />
          </div>
        </div>

        {/* Preview generated credentials */}
        {newCadet.name && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
            <h4 className="text-white font-bold mb-2">Предварительный просмотр:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-200">
              <div>
                <strong>Email:</strong> {generateEmail(newCadet.name)}
              </div>
              <div>
                <strong>Пароль:</strong> {generatePassword(newCadet.name)}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={addCadet}
          disabled={!newCadet.name || !newCadet.platoon}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-5 w-5" />
          <span>Добавить в список</span>
        </button>
      </motion.div>

      {/* Cadets List */}
      {cadets.length > 0 && (
        <motion.div variants={staggerItem} className="card-hover p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-yellow-400" />
              <h3 className="text-2xl font-bold text-white">Список кадетов ({cadets.length})</h3>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={exportToExcel}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Экспорт</span>
              </button>
              <button
                onClick={clearList}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Очистить</span>
              </button>
              <button
                onClick={createAllCadets}
                disabled={creating}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {creating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-5 w-5" />
                )}
                <span>{creating ? 'Создание...' : 'Создать всех'}</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {creating && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-semibold">
                  Создание кадетов: {progress.current} из {progress.total}
                </span>
                <span className="text-blue-300">
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Cadets Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left text-white font-bold py-3 px-4">№</th>
                  <th className="text-left text-white font-bold py-3 px-4">ФИО</th>
                  <th className="text-left text-white font-bold py-3 px-4">Взвод</th>
                  <th className="text-left text-white font-bold py-3 px-4">Отделение</th>
                  <th className="text-left text-white font-bold py-3 px-4">Email</th>
                  <th className="text-left text-white font-bold py-3 px-4">Пароль</th>
                  <th className="text-left text-white font-bold py-3 px-4">Телефон</th>
                  <th className="text-center text-white font-bold py-3 px-4">Действия</th>
                </tr>
              </thead>
              <tbody className="max-h-96 overflow-y-auto">
                {cadets.map((cadet, index) => (
                  <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-3 px-4 text-blue-300 font-semibold">{index + 1}</td>
                    <td className="py-3 px-4 text-white font-semibold">{cadet.name}</td>
                    <td className="py-3 px-4 text-blue-300">{cadet.platoon}</td>
                    <td className="py-3 px-4 text-blue-300">{cadet.squad}</td>
                    <td className="py-3 px-4 text-green-300 font-mono text-sm">{cadet.email}</td>
                    <td className="py-3 px-4 text-yellow-300 font-mono text-sm">{cadet.password}</td>
                    <td className="py-3 px-4 text-blue-300">{cadet.phone || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => removeCadet(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {(results.success.length > 0 || results.errors.length > 0) && (
        <motion.div variants={staggerItem} className="card-hover p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Результаты создания</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Success */}
            {results.success.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <h4 className="text-xl font-bold text-green-400">
                    Успешно создано ({results.success.length})
                  </h4>
                </div>
                <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-4 max-h-64 overflow-y-auto">
                  {results.success.map((success, index) => (
                    <div key={index} className="text-green-300 text-sm py-1">
                      ✓ {success}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {results.errors.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                  <h4 className="text-xl font-bold text-red-400">
                    Ошибки ({results.errors.length})
                  </h4>
                </div>
                <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 max-h-64 overflow-y-auto">
                  {results.errors.map((error, index) => (
                    <div key={index} className="text-red-300 text-sm py-1">
                      ✗ {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Excel Preview Modal */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-effect rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <Eye className="h-8 w-8 text-blue-400" />
                <h2 className="text-3xl font-bold text-white">Предварительный просмотр Excel</h2>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-white hover:text-red-400 transition-colors"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-blue-200 mb-4">
                Найдено строк: {excelData.length - 1} (исключая заголовок)
              </p>
              
              {/* Excel Data Preview */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      {excelData[0]?.map((header: string, index: number) => (
                        <th key={index} className="text-left text-white font-bold py-2 px-3">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {excelData.slice(1, 11).map((row: any[], index: number) => (
                      <tr key={index} className="border-b border-white/10">
                        {row.map((cell: any, cellIndex: number) => (
                          <td key={cellIndex} className="py-2 px-3 text-blue-200">
                            {cell?.toString() || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {excelData.length > 11 && (
                  <p className="text-blue-400 text-center mt-4">
                    ... и еще {excelData.length - 11} строк
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={parseExcelData}
                className="flex-1 btn-primary flex items-center justify-center space-x-2"
              >
                <Upload className="h-5 w-5" />
                <span>Импортировать данные</span>
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors"
              >
                Отмена
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BulkCadetCreation;