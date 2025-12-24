import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Select,
  SelectItem,
  Button,
} from '@heroui/react'
import { Palette, Globe, FileText, Trash2, ExternalLink } from 'lucide-react'
import { useThemeStore, PREMIUM_COLORS, type ColorKey } from '@/store/themeStore'
import { useLanguageStore } from '@/store/languageStore'
import { storage } from '@/lib/storage'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Browser } from '@capacitor/browser'
import { motion } from 'framer-motion'

interface SavedFile {
  name: string
  path: string
  date: string
}

export const Settings: React.FC = () => {
  const { t } = useTranslation()
  const { primaryColor, setPrimaryColor, loadTheme } = useThemeStore()
  const { language, setLanguage } = useLanguageStore()
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)

  useEffect(() => {
    loadTheme()
    loadSavedFiles()
  }, [loadTheme])

  const loadSavedFiles = async () => {
    try {
      setLoadingFiles(true)
      const files = await storage.get<SavedFile[]>('savedPdfs') || []
      setSavedFiles(files)
    } catch (err) {
      console.error('Error loading saved files:', err)
    } finally {
      setLoadingFiles(false)
    }
  }

  const openFile = async (file: SavedFile) => {
    try {
      if (Capacitor.isNativePlatform()) {
        // For Android/iOS - use file URI to open with system PDF viewer
        try {
          // Get file URI
          const fileUri = await Filesystem.getUri({
            path: file.name,
            directory: Directory.Documents
          })
          
          // Open with system PDF viewer using Browser plugin
          // On Android, this will open with default PDF viewer
          await Browser.open({ 
            url: fileUri.uri,
            windowName: '_system'
          })
        } catch (err) {
          console.error('Error opening file:', err)
          // Fallback: try to read and share
          try {
            const fileData = await Filesystem.readFile({
              path: file.name,
              directory: Directory.Documents
            })
            
            // Create a blob URL and open it
            const base64Data = fileData.data as string
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            
            // Try to open with browser
            await Browser.open({ url })
          } catch (fallbackErr) {
            console.error('Error in fallback:', fallbackErr)
          }
        }
      } else {
        // For web - download the file
        const files = await storage.get<SavedFile[]>('savedPdfs') || []
        const fileIndex = files.findIndex(f => f.name === file.name)
        if (fileIndex !== -1 && files[fileIndex].path) {
          window.open(files[fileIndex].path, '_blank')
        }
      }
    } catch (err) {
      console.error('Error opening file:', err)
    }
  }

  const deleteFile = async (fileName: string) => {
    try {
      // Delete from filesystem
      if (Capacitor.isNativePlatform()) {
        try {
          await Filesystem.deleteFile({
            path: fileName,
            directory: Directory.Documents
          })
        } catch (err) {
          console.error('Error deleting file from filesystem:', err)
        }
      }

      // Remove from storage
      const files = await storage.get<SavedFile[]>('savedPdfs') || []
      const updatedFiles = files.filter(f => f.name !== fileName)
      await storage.set('savedPdfs', updatedFiles)
      setSavedFiles(updatedFiles)
    } catch (err) {
      console.error('Error deleting file:', err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Primary Color */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
        >
          <Card className="premium-card">
            <CardHeader className="flex items-center gap-3 pb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('settings.primaryColor')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('settings.primaryColorDescription')}
                </p>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="pt-6">
              <div className="space-y-4">
                <Select
                  label={t('settings.selectColor')}
                  selectedKeys={[primaryColor]}
                  onSelectionChange={(keys) => {
                    const color = Array.from(keys)[0] as ColorKey
                    if (color) {
                      setPrimaryColor(color)
                    }
                  }}
                  variant="bordered"
                  classNames={{
                    trigger: 'bg-white dark:bg-gray-800',
                  }}
                >
                  {Object.entries(PREMIUM_COLORS).map(([key, color]) => (
                    <SelectItem key={key}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: color.value }}
                        />
                        <span>{color.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>

                {/* Color Preview */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {Object.entries(PREMIUM_COLORS).map(([key, color]) => (
                    <button
                      key={key}
                      onClick={() => setPrimaryColor(key as ColorKey)}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        primaryColor === key
                          ? 'border-primary scale-110 shadow-lg'
                          : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      aria-label={`Select ${color.name} color`}
                    />
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Language */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="premium-card">
            <CardHeader className="flex items-center gap-3 pb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('settings.language')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('settings.languageDescription')}
                </p>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="pt-6">
              <Select
                label={t('settings.selectLanguage')}
                selectedKeys={[language]}
                onSelectionChange={(keys) => {
                  const lang = Array.from(keys)[0] as 'uz' | 'en' | 'ru'
                  if (lang) {
                    setLanguage(lang)
                  }
                }}
                variant="bordered"
                classNames={{
                  trigger: 'bg-white dark:bg-gray-800',
                }}
              >
                <SelectItem key="uz">
                  O'zbek
                </SelectItem>
                <SelectItem key="en">
                  English
                </SelectItem>
                <SelectItem key="ru">
                  Русский
                </SelectItem>
              </Select>
            </CardBody>
          </Card>
        </motion.div>

        {/* Downloaded Files */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="premium-card">
            <CardHeader className="flex items-center gap-3 pb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('settings.downloadedFiles')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('settings.downloadedFilesDescription')}
                </p>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="pt-6">
              {loadingFiles ? (
                <div className="text-center py-8 text-gray-500">
                  {t('common.loading')}
                </div>
              ) : savedFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('settings.noFiles')}
                </div>
              ) : (
                <div className="space-y-3">
                  {savedFiles.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(file.date).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          color="primary"
                          onPress={() => openFile(file)}
                          aria-label={t('settings.openFile')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          color="danger"
                          onPress={() => deleteFile(file.name)}
                          aria-label={t('settings.deleteFile')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
    </div>
  )
}

