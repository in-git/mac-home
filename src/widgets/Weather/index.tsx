import React from 'react';
import { useWeatherData } from './useWeatherData';
import { WeatherSummary } from './types';
import { CityHeader } from './components/CityHeader';
import { CitySearchPanel } from './components/CitySearchPanel';
import { CurrentWeatherCard } from './components/CurrentWeatherCard';
import { DailyForecast } from './components/DailyForecast';
import { WeatherSkeleton } from './components/WeatherSkeleton';

export interface WeatherWidgetProps {
  onWeatherChange?: (s: WeatherSummary) => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ onWeatherChange }) => {
  const {
    cities,
    selectedId,
    selectedCity,
    weather,
    loading,
    error,
    locating,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    searchInputRef,
    selectCity,
    addCity,
    removeCity,
    locate,
    refresh,
  } = useWeatherData(onWeatherChange);

  return (
    <div className="w-full text-slate-800 dark:text-slate-100">
      <CityHeader
        cities={cities}
        selectedId={selectedId}
        selectedCity={selectedCity}
        locating={locating}
        loading={loading}
        onSelect={selectCity}
        onRemove={removeCity}
        onToggleSearch={() => setSearchOpen((v) => !v)}
        onLocate={locate}
        onRefresh={refresh}
        searchOpen={searchOpen}
      />

      {searchOpen && (
        <CitySearchPanel
          query={searchQuery}
          results={searchResults}
          searching={searching}
          inputRef={searchInputRef}
          onQueryChange={setSearchQuery}
          onSelect={addCity}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {loading ? (
        <WeatherSkeleton />
      ) : (
        weather && (
          <div className="flex flex-col">
            {error && (
              <p className="text-font-sm text-amber-500 mb-1">{error}</p>
            )}

            <CurrentWeatherCard weather={weather} />

            <DailyForecast daily={weather.dailyForecast} />
          </div>
        )
      )}
    </div>
  );
};

export default WeatherWidget;
export type { WeatherSummary } from './types';
