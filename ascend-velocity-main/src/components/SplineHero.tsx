import { SplineScene } from "@/components/ui/splite";
 
export function SplineHero() {
  return (
    <div className="w-full h-[600px] relative overflow-hidden rounded-2xl">
      <SplineScene 
        scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
        className="w-full h-full"
      />
    </div>
  );
}
